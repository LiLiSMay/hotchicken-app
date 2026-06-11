import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  CreateUsuarioDto,
  UpdateUsuarioDto,
  GestionarSolicitudDto,
} from './dto/usuario.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolUsuario } from '../common/enums';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Listar todos los empleados' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get('solicitudes/pendientes')
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Ver solicitudes pendientes de aprobación' })
  getSolicitudesPendientes() {
    return this.usersService.findSolicitudesPendientes();
  }

  @Get(':id')
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Obtener empleado por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Crear empleado directamente (sin solicitud)' })
  @ApiResponse({ status: 201, description: 'Empleado creado exitosamente' })
  @ApiResponse({ status: 409, description: 'El username ya existe' })
  create(@Body() dto: CreateUsuarioDto) {
    return this.usersService.create(dto);
  }

  @Put(':id')
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Actualizar datos de empleado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsuarioDto,
  ) {
    return this.usersService.update(id, dto);
  }

  /**
   * PATCH /:id/estado — Cambia activo <-> inactivo sin borrar el registro.
   * Reemplaza al antiguo /desactivar para poder también reactivar.
   */
  @Patch(':id/estado')
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Cambiar estado activo/inactivo del empleado' })
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: 'activo' | 'inactivo',
  ) {
    return this.usersService.cambiarEstado(id, estado);
  }

  /**
   * DELETE /:id — Eliminación física del registro en BD.
   * Solo se puede eliminar a empleados inactivos para evitar
   * borrar a alguien con comandas activas.
   */
  @Delete(':id')
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar empleado permanentemente (solo inactivos)' })
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.eliminar(id);
  }

  // Mantener /desactivar por compatibilidad con código existente
  @Patch(':id/desactivar')
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Desactivar empleado (alias de PATCH estado=inactivo)' })
  desactivar(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.cambiarEstado(id, 'inactivo');
  }

  @Patch(':id/gestionar-solicitud')
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprobar o rechazar solicitud de registro' })
  gestionarSolicitud(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: GestionarSolicitudDto,
  ) {
    return this.usersService.gestionarSolicitud(id, dto);
  }
}
