import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Comanda } from '../comandas/comanda.entity';
import { ItemComanda } from '../comandas/item-comanda.entity';
import { EstadoComanda, TipoReporte } from '../common/enums';

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Comanda)
    private readonly comandaRepository: Repository<Comanda>,
    @InjectRepository(ItemComanda)
    private readonly itemRepository: Repository<ItemComanda>,
  ) {}

  private getRango(tipo: TipoReporte): { desde: Date; hasta: Date } {
    const hasta = new Date(); hasta.setHours(23, 59, 59, 999);
    const desde = new Date(); desde.setHours(0, 0, 0, 0);
    if (tipo === TipoReporte.SEMANAL) desde.setDate(desde.getDate() - 6);
    else if (tipo === TipoReporte.MENSUAL) desde.setDate(1);
    return { desde, hasta };
  }

  private normalizarRango(desde: Date, hasta: Date) {
    const d = new Date(desde); d.setHours(0, 0, 0, 0);
    const h = new Date(hasta); h.setHours(23, 59, 59, 999);
    return { desde: d, hasta: h };
  }

  // ─── KPIs del día ────────────────────────────────────────────────────────
  async dashboardKpis() {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy); manana.setDate(manana.getDate() + 1);

    const ventasHoy = await this.comandaRepository
      .createQueryBuilder('comanda')
      .select('COALESCE(SUM(comanda.total), 0)', 'total')
      .addSelect('COUNT(comanda.id)', 'cantidad')
      .where('comanda.estado = :estado', { estado: EstadoComanda.CERRADA })
      .andWhere('comanda.creadoEn >= :hoy AND comanda.creadoEn < :manana', { hoy, manana })
      .getRawOne();

    const platosVendidos = await this.itemRepository
      .createQueryBuilder('item')
      .innerJoin('item.comanda', 'comanda')
      .select('COALESCE(SUM(item.cantidad), 0)', 'total')
      .where('comanda.estado = :estado', { estado: EstadoComanda.CERRADA })
      .andWhere('comanda.creadoEn >= :hoy AND comanda.creadoEn < :manana', { hoy, manana })
      .getRawOne();

    const comandasActivas = await this.comandaRepository.count({
      where: [{ estado: EstadoComanda.ABIERTA }, { estado: EstadoComanda.EN_COCINA }],
    });

    return {
      ventasTotalesHoy: Math.round(Number(ventasHoy?.total ?? 0) * 100) / 100,
      comandasCerradasHoy: Number(ventasHoy?.cantidad ?? 0),
      platosVendidosHoy: Number(platosVendidos?.total ?? 0),
      comandasActivasAhora: comandasActivas,
    };
  }

  // ─── KPIs rango personalizado ────────────────────────────────────────────
  async kpisRango(desde: Date, hasta: Date) {
    const r = this.normalizarRango(desde, hasta);

    const ventas = await this.comandaRepository
      .createQueryBuilder('comanda')
      .select('COALESCE(SUM(comanda.total), 0)', 'total')
      .addSelect('COUNT(comanda.id)', 'cantidad')
      .where('comanda.estado = :estado', { estado: EstadoComanda.CERRADA })
      .andWhere('comanda.creadoEn >= :desde AND comanda.creadoEn <= :hasta', r)
      .getRawOne();

    const platos = await this.itemRepository
      .createQueryBuilder('item')
      .innerJoin('item.comanda', 'comanda')
      .select('COALESCE(SUM(item.cantidad), 0)', 'total')
      .where('comanda.estado = :estado', { estado: EstadoComanda.CERRADA })
      .andWhere('comanda.creadoEn >= :desde AND comanda.creadoEn <= :hasta', r)
      .getRawOne();

    const activas = await this.comandaRepository.count({
      where: [{ estado: EstadoComanda.ABIERTA }, { estado: EstadoComanda.EN_COCINA }],
    });

    return {
      desde: r.desde, hasta: r.hasta,
      ventasTotalesHoy: Math.round(Number(ventas?.total ?? 0) * 100) / 100,
      comandasCerradasHoy: Number(ventas?.cantidad ?? 0),
      platosVendidosHoy: Number(platos?.total ?? 0),
      comandasActivasAhora: activas,
    };
  }

  // ─── Ventas por producto en rango (gráfico + tabla + PDF) ────────────────
  // FIX 1: leftJoin evita conflicto con eager:true en ItemComanda.producto
  // FIX 2: orderBy usa la expresión SQL directa, no el alias (PostgreSQL
  //         es case-sensitive con alias en ORDER BY y falla con 'totalVentas')
  async productosPorRango(desde: Date, hasta: Date) {
    const r = this.normalizarRango(desde, hasta);

    const result = await this.itemRepository
      .createQueryBuilder('item')
      .innerJoin('item.comanda', 'comanda')
      .leftJoin('item.producto', 'producto')
      .select('producto.nombre', 'nombre')
      .addSelect('producto.categoria', 'categoria')
      .addSelect('SUM(item.cantidad)', 'cantidadVendida')
      .addSelect('SUM(item.precioUnitario * item.cantidad)', 'totalVentas')
      .where('comanda.estado = :estado', { estado: EstadoComanda.CERRADA })
      .andWhere('comanda.creadoEn >= :desde AND comanda.creadoEn <= :hasta', r)
      .groupBy('producto.nombre')
      .addGroupBy('producto.categoria')
      // ✅ Expresión directa en lugar del alias — funciona en PostgreSQL
      .orderBy('SUM(item.precioUnitario * item.cantidad)', 'DESC')
      .getRawMany();

    return {
      desde: r.desde, hasta: r.hasta,
      data: result.map((row) => ({
        name: row.nombre,
        categoria: row.categoria,
        ventas: Number(row.cantidadVendida),
        ingresos: Math.round(Number(row.totalVentas) * 100) / 100,
      })),
    };
  }

  // ─── Ventas por categoría (fallback del gráfico) ─────────────────────────
  async ventasPorCategoria(tipo: TipoReporte) {
    const { desde, hasta } = this.getRango(tipo);

    const result = await this.itemRepository
      .createQueryBuilder('item')
      .innerJoin('item.comanda', 'comanda')
      .leftJoin('item.producto', 'producto')
      .select('producto.nombre', 'nombre')
      .addSelect('producto.categoria', 'categoria')
      .addSelect('SUM(item.cantidad)', 'cantidadVendida')
      .addSelect('SUM(item.precioUnitario * item.cantidad)', 'totalVentas')
      .where('comanda.estado = :estado', { estado: EstadoComanda.CERRADA })
      .andWhere('comanda.creadoEn >= :desde AND comanda.creadoEn <= :hasta', { desde, hasta })
      .groupBy('producto.nombre')
      .addGroupBy('producto.categoria')
      .orderBy('SUM(item.precioUnitario * item.cantidad)', 'DESC')
      .getRawMany();

    return {
      tipo, desde, hasta,
      data: result.map((r) => ({
        name: r.nombre, categoria: r.categoria,
        ventas: Number(r.cantidadVendida),
        ingresos: Math.round(Number(r.totalVentas) * 100) / 100,
      })),
    };
  }

  // ─── Resumen de ventas por período ───────────────────────────────────────
  async ventasPorPeriodo(tipo: TipoReporte) {
    const { desde, hasta } = this.getRango(tipo);
    const comandas = await this.comandaRepository.find({
      where: { estado: EstadoComanda.CERRADA, creadoEn: Between(desde, hasta) },
    });
    const totalVentas = comandas.reduce((s, c) => s + Number(c.total), 0);
    return { tipo, desde, hasta, totalVentas: Math.round(totalVentas * 100) / 100, totalComandas: comandas.length };
  }

  // ─── Inventario detallado para PDF ───────────────────────────────────────
  async inventarioPlatosVendidos(tipo: TipoReporte) {
    const { desde, hasta } = this.getRango(tipo);

    const result = await this.itemRepository
      .createQueryBuilder('item')
      .innerJoin('item.comanda', 'comanda')
      .leftJoin('item.producto', 'producto')
      .select('producto.nombre', 'producto')
      .addSelect('producto.categoria', 'categoria')
      .addSelect('SUM(item.cantidad)', 'unidadesVendidas')
      .addSelect('SUM(item.precioUnitario * item.cantidad)', 'ingresoTotal')
      .where('comanda.estado = :estado', { estado: EstadoComanda.CERRADA })
      .andWhere('comanda.creadoEn >= :desde AND comanda.creadoEn <= :hasta', { desde, hasta })
      .groupBy('producto.nombre')
      .addGroupBy('producto.categoria')
      .orderBy('SUM(item.cantidad)', 'DESC')
      .getRawMany();

    return {
      tipo, desde, hasta,
      detalle: result.map((r) => ({
        producto: r.producto, categoria: r.categoria,
        unidadesVendidas: Number(r.unidadesVendidas),
        ingresoTotal: Math.round(Number(r.ingresoTotal) * 100) / 100,
      })),
      totalGeneral: result.reduce((s, r) => s + Math.round(Number(r.ingresoTotal) * 100) / 100, 0),
    };
  }
}
