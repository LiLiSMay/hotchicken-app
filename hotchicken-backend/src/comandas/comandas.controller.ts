import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ComandasService } from './comandas.service';
import { CreateComandaDto, UpdateEstadoComandaDto } from './dto/comanda.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('comandas')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('comandas')
export class ComandasController {
  constructor(private readonly comandasService: ComandasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nueva comanda (mesa, para llevar o delivery)' })
  crear(
    @Body() dto: CreateComandaDto,
    @CurrentUser('userId') meseroId: number,
  ) {
    return this.comandasService.crear(dto, meseroId);
  }

  @Get('abiertas')
  @ApiOperation({ summary: 'Ver comandas activas (abiertas + en cocina)' })
  findAbiertas() {
    return this.comandasService.findAbiertas();
  }

  @Get('entregadas-hoy')
  @ApiOperation({ summary: 'Historial de platos entregados hoy (sección cocina)' })
  findEntregadasHoy() {
    return this.comandasService.findEntregadasHoy();
  }

  @Get('ventas-hoy')
  @ApiOperation({ summary: 'Resumen de ventas del día para el dashboard' })
  ventasHoy() {
    return this.comandasService.ventasHoy();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver detalle de una comanda' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.comandasService.findOne(id);
  }

  @Patch(':id/estado')
  @ApiOperation({
    summary: 'Cambiar estado de comanda',
    description:
      'Flujo: ABIERTA → EN_COCINA → ENTREGADA → CERRADA. Cerrar libera la mesa.',
  })
  actualizarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEstadoComandaDto,
  ) {
    return this.comandasService.actualizarEstado(id, dto);
  }
}
