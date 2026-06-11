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
import { MesasService, CreateMesaDto, UpdateMesaEstadoDto } from './mesas.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolUsuario } from '../common/enums';

@ApiTags('mesas')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('mesas')
export class MesasController {
  constructor(private readonly mesasService: MesasService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener estado de todas las mesas' })
  findAll() {
    return this.mesasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener mesa por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.mesasService.findOne(id);
  }

  @Post()
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Agregar nueva mesa (solo admin)' })
  create(@Body() dto: CreateMesaDto) {
    return this.mesasService.create(dto);
  }

  @Patch(':id/estado')
  @ApiOperation({ summary: 'Actualizar estado de mesa (libre/ocupada/reservada)' })
  actualizarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMesaEstadoDto,
  ) {
    return this.mesasService.actualizarEstado(id, dto);
  }

  @Post('inicializar')
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({
    summary: 'Inicializar mesas del restaurante',
    description: 'Crea las mesas numeradas del 1 al N si no existen',
  })
  inicializar(@Body('cantidad') cantidad: number) {
    return this.mesasService.inicializarMesas(cantidad || 10);
  }
}
