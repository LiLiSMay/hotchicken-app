import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolUsuario, TipoReporte } from '../common/enums';

@ApiTags('reportes')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
// ✅ SIN @Roles a nivel de clase — cada endpoint decide su restricción
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  /**
   * ✅ Sin @Roles — cualquier usuario autenticado puede ver los KPIs del día.
   * El problema original era @Roles(ADMIN) en la clase bloqueaba este endpoint
   * cuando el JWT tenía rol 'admin' en minúsculas vs el enum 'ADMIN'.
   */
  @Get('dashboard')
  @ApiOperation({ summary: 'KPIs en tiempo real (sin restricción de rol)' })
  dashboardKpis() {
    return this.reportesService.dashboardKpis();
  }

  /**
   * ✅ NUEVO — KPIs para rango de fechas personalizado.
   * GET /reportes/kpis-rango?desde=2026-06-01&hasta=2026-06-10
   */
  @Get('kpis-rango')
  @ApiOperation({ summary: 'KPIs para rango de fechas personalizado' })
  @ApiQuery({ name: 'desde', required: true, example: '2026-06-01' })
  @ApiQuery({ name: 'hasta', required: true, example: '2026-06-10' })
  kpisRango(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    return this.reportesService.kpisRango(new Date(desde), new Date(hasta));
  }

  /**
   * ✅ NUEVO — Ventas por producto en rango de fechas (para gráfico y PDF).
   * GET /reportes/productos-rango?desde=2026-06-01&hasta=2026-06-10
   */
  @Get('productos-rango')
  @ApiOperation({ summary: 'Ventas por producto en rango de fechas' })
  @ApiQuery({ name: 'desde', required: true, example: '2026-06-01' })
  @ApiQuery({ name: 'hasta', required: true, example: '2026-06-10' })
  productosPorRango(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    return this.reportesService.productosPorRango(new Date(desde), new Date(hasta));
  }

  @Get('ventas')
  @Roles(RolUsuario.ADMIN)
  @ApiQuery({ name: 'tipo', enum: TipoReporte, required: false })
  @ApiOperation({ summary: 'Resumen de ventas por período (solo admin)' })
  ventasPorPeriodo(@Query('tipo') tipo: TipoReporte = TipoReporte.DIARIO) {
    return this.reportesService.ventasPorPeriodo(tipo);
  }

  @Get('categorias')
  @ApiQuery({ name: 'tipo', enum: TipoReporte, required: false })
  @ApiOperation({ summary: 'Ventas por categoría — fallback del gráfico' })
  ventasPorCategoria(@Query('tipo') tipo: TipoReporte = TipoReporte.DIARIO) {
    return this.reportesService.ventasPorCategoria(tipo);
  }

  @Get('inventario-platos')
  @Roles(RolUsuario.ADMIN)
  @ApiQuery({ name: 'tipo', enum: TipoReporte, required: false })
  @ApiOperation({ summary: 'Inventario detallado para exportar PDF (solo admin)' })
  inventarioPlatosVendidos(@Query('tipo') tipo: TipoReporte = TipoReporte.DIARIO) {
    return this.reportesService.inventarioPlatosVendidos(tipo);
  }
}
