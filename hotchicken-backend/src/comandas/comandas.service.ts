import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Comanda } from './comanda.entity';
import { ItemComanda } from './item-comanda.entity';
import {
  CreateComandaDto,
  UpdateEstadoComandaDto,
} from './dto/comanda.dto';
import { ProductosService } from '../productos/productos.service';
import { MesasService } from '../mesas/mesas.service';
import { EstadoComanda, EstadoMesa, TipoPedido } from '../common/enums';

@Injectable()
export class ComandasService {
  constructor(
    @InjectRepository(Comanda)
    private readonly comandaRepository: Repository<Comanda>,

    @InjectRepository(ItemComanda)
    private readonly itemRepository: Repository<ItemComanda>,

    private readonly productosService: ProductosService,
    private readonly mesasService: MesasService,
  ) {}

  // ─── Crear nueva comanda ───
  async crear(dto: CreateComandaDto, meseroId: number): Promise<Comanda> {
    // Si es pedido de mesa, verificar que exista y esté libre
    if (dto.tipoPedido === TipoPedido.MESA && dto.mesaId) {
      const mesa = await this.mesasService.findOne(dto.mesaId);
      if (mesa.estado === EstadoMesa.OCUPADA) {
        throw new BadRequestException(`La mesa #${mesa.numero} ya tiene una comanda activa`);
      }
      // Marcar mesa como ocupada
      await this.mesasService.actualizarEstado(dto.mesaId, {
        estado: EstadoMesa.OCUPADA,
      });
    }

    // Construir items con precio actual
    const items: Partial<ItemComanda>[] = [];
    let total = 0;

    for (const itemDto of dto.items) {
      const producto = await this.productosService.findOne(itemDto.productoId);
      const subtotal = Number(producto.precio) * itemDto.cantidad;
      total += subtotal;

      items.push({
        productoId: producto.id,
        cantidad: itemDto.cantidad,
        precioUnitario: producto.precio,
        guarnicion: itemDto.guarnicion,
        presa: itemDto.presa,
        notas: itemDto.notas,
      });
    }

    const comanda = this.comandaRepository.create({
      tipoPedido: dto.tipoPedido,
      mesaId: dto.mesaId,
      meseroId,
      observaciones: dto.observaciones,
      total,
      items: items as ItemComanda[],
    });

    return this.comandaRepository.save(comanda);
  }

  // ─── Obtener todas las comandas abiertas (abierta + en_cocina + entregada esperando cobro) ───
  async findAbiertas(): Promise<Comanda[]> {
    return this.comandaRepository.find({
      where: [
        { estado: EstadoComanda.ABIERTA },
        { estado: EstadoComanda.EN_COCINA },
        { estado: EstadoComanda.ENTREGADA },
      ],
      order: { creadoEn: 'ASC' },
    });
  }

  // ─── Historial de entregados del turno (para la sección de cocina) ───
  // Muestra las comandas CERRADAS (cobradas) del día como historial completo
  async findEntregadasHoy(): Promise<Comanda[]> {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    return this.comandaRepository
      .createQueryBuilder('comanda')
      .leftJoinAndSelect('comanda.mesero', 'mesero')
      .leftJoinAndSelect('comanda.mesa', 'mesa')
      .leftJoinAndSelect('comanda.items', 'items')
      .leftJoinAndSelect('items.producto', 'producto')
      .where('comanda.estado IN (:...estados)', {
        estados: [EstadoComanda.CERRADA, EstadoComanda.ENTREGADA],
      })
      .andWhere(
        'COALESCE(comanda.cerradoEn, comanda.creadoEn) BETWEEN :hoy AND :manana',
        { hoy, manana },
      )
      .orderBy('comanda.actualizadoEn', 'DESC')
      .getMany();
  }

  // ─── Buscar comanda por ID ───
  async findOne(id: number): Promise<Comanda> {
    const comanda = await this.comandaRepository.findOne({ where: { id } });
    if (!comanda) throw new NotFoundException(`Comanda #${id} no encontrada`);
    return comanda;
  }

  // ─── Cambiar estado de comanda ───
  async actualizarEstado(
    id: number,
    dto: UpdateEstadoComandaDto,
  ): Promise<Comanda> {
    const comanda = await this.findOne(id);

    comanda.estado = dto.estado;

    // Cuando se marca como entregada desde cocina
    if (dto.estado === EstadoComanda.ENTREGADA) {
      comanda.entregadoACocina = true;
    }

    // Cuando se cierra (cobrada) o cancela, liberar la mesa y registrar fecha de cierre
    if (
      dto.estado === EstadoComanda.CERRADA ||
      dto.estado === EstadoComanda.CANCELADA
    ) {
      comanda.cerradoEn = new Date();
      if (comanda.mesaId) {
        await this.mesasService.actualizarEstado(comanda.mesaId, {
          estado: EstadoMesa.LIBRE,
        });
      }
    }

    return this.comandaRepository.save(comanda);
  }

  // ─── Ventas del día (para dashboard) ───
  async ventasHoy(): Promise<{ total: number; cantidadComandas: number }> {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const result = await this.comandaRepository
      .createQueryBuilder('comanda')
      .select('SUM(comanda.total)', 'total')
      .addSelect('COUNT(comanda.id)', 'cantidadComandas')
      .where('comanda.estado = :estado', { estado: EstadoComanda.CERRADA })
      .andWhere(
        'COALESCE(comanda.cerradoEn, comanda.creadoEn) BETWEEN :hoy AND :manana',
        { hoy, manana },
      )
      .getRawOne();

    return {
      total: Number(result.total) || 0,
      cantidadComandas: Number(result.cantidadComandas) || 0,
    };
  }
}
