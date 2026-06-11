import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from './usuario.entity';
import {
  CreateUsuarioDto,
  UpdateUsuarioDto,
  GestionarSolicitudDto,
} from './dto/usuario.dto';
import {
  EstadoEmpleado,
  EstadoSolicitud,
  RolUsuario,
} from '../common/enums';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async findByUsername(username: string): Promise<Usuario | null> {
    return this.usuarioRepository
      .createQueryBuilder('usuario')
      .addSelect('usuario.password')
      .where('usuario.username = :username', { username })
      .getOne();
  }

  // ─── Devuelve TODOS los aprobados (activos + inactivos) ──────────────────
  // Antes solo devolvía activos — ahora el frontend muestra ambos estados.
  async findAll(): Promise<Usuario[]> {
    return this.usuarioRepository.find({
      where: { estadoSolicitud: EstadoSolicitud.APROBADO },
      order: { creadoEn: 'DESC' },
    });
  }

  async findSolicitudesPendientes(): Promise<Usuario[]> {
    return this.usuarioRepository.find({
      where: { estadoSolicitud: EstadoSolicitud.PENDIENTE },
      order: { creadoEn: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({ where: { id } });
    if (!usuario) throw new NotFoundException(`Empleado con ID ${id} no encontrado`);
    return usuario;
  }

  async create(dto: CreateUsuarioDto): Promise<Usuario> {
    const existe = await this.usuarioRepository.findOne({ where: { username: dto.username } });
    if (existe) throw new ConflictException(`El username "${dto.username}" ya está en uso`);

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const nuevoUsuario = this.usuarioRepository.create({
      ...dto,
      password: hashedPassword,
      estadoSolicitud: EstadoSolicitud.APROBADO,
      estado: dto.estado ?? EstadoEmpleado.ACTIVO,
    });
    return this.usuarioRepository.save(nuevoUsuario);
  }

  async update(id: number, dto: UpdateUsuarioDto): Promise<Usuario> {
    const usuario = await this.findOne(id);
    if (dto.password) dto.password = await bcrypt.hash(dto.password, 10);
    if (dto.username && dto.username !== usuario.username) {
      const existe = await this.usuarioRepository.findOne({ where: { username: dto.username } });
      if (existe) throw new ConflictException(`El username "${dto.username}" ya está en uso`);
    }
    Object.assign(usuario, dto);
    return this.usuarioRepository.save(usuario);
  }

  // ─── Cambiar estado activo <-> inactivo ──────────────────────────────────
  async cambiarEstado(id: number, estado: 'activo' | 'inactivo'): Promise<Usuario> {
    const usuario = await this.findOne(id);
    if (usuario.rol === RolUsuario.ADMIN) {
      throw new BadRequestException('No se puede modificar el estado de un administrador');
    }
    usuario.estado = estado === 'activo' ? EstadoEmpleado.ACTIVO : EstadoEmpleado.INACTIVO;
    return this.usuarioRepository.save(usuario);
  }

  // ─── Eliminación FÍSICA — solo permitida si el empleado está inactivo ────
  async eliminar(id: number): Promise<void> {
    const usuario = await this.findOne(id);
    if (usuario.rol === RolUsuario.ADMIN) {
      throw new BadRequestException('No se puede eliminar a un administrador');
    }
    if (usuario.estado === EstadoEmpleado.ACTIVO) {
      throw new BadRequestException(
        'Desactiva al empleado antes de eliminarlo permanentemente',
      );
    }
    await this.usuarioRepository.delete(id);
  }

  // ─── Alias mantenido por compatibilidad ──────────────────────────────────
  async desactivar(id: number): Promise<Usuario> {
    return this.cambiarEstado(id, 'inactivo');
  }

  async gestionarSolicitud(id: number, dto: GestionarSolicitudDto): Promise<Usuario> {
    const usuario = await this.findOne(id);
    if (usuario.estadoSolicitud !== EstadoSolicitud.PENDIENTE) {
      throw new BadRequestException('Esta solicitud ya fue procesada anteriormente');
    }
    if (dto.estadoSolicitud === EstadoSolicitud.APROBADO) {
      if (dto.usernameAsignado) {
        const existe = await this.usuarioRepository.findOne({ where: { username: dto.usernameAsignado } });
        if (existe && existe.id !== id) throw new ConflictException(`El username "${dto.usernameAsignado}" ya está en uso`);
        usuario.username = dto.usernameAsignado;
      }
      if (dto.passwordAsignada) usuario.password = await bcrypt.hash(dto.passwordAsignada, 10);
      usuario.estadoSolicitud = EstadoSolicitud.APROBADO;
      usuario.estado = EstadoEmpleado.ACTIVO;
    } else if (dto.estadoSolicitud === EstadoSolicitud.RECHAZADO) {
      usuario.estadoSolicitud = EstadoSolicitud.RECHAZADO;
      usuario.estado = EstadoEmpleado.INACTIVO;
      usuario.motivoRechazo = dto.motivoRechazo || 'Solicitud rechazada';
    }
    return this.usuarioRepository.save(usuario);
  }

  async registrarSolicitud(dto: { nombreCompleto: string; username: string; password: string }): Promise<Usuario> {
    const existe = await this.usuarioRepository.findOne({ where: { username: dto.username } });
    if (existe) throw new ConflictException(`El username "${dto.username}" ya está registrado`);
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const solicitud = this.usuarioRepository.create({
      nombreCompleto: dto.nombreCompleto,
      username: dto.username,
      password: hashedPassword,
      rol: RolUsuario.MESERO,
      estadoSolicitud: EstadoSolicitud.PENDIENTE,
      estado: EstadoEmpleado.INACTIVO,
    });
    return this.usuarioRepository.save(solicitud);
  }

  async contarMeserosActivos(): Promise<number> {
    return this.usuarioRepository.count({
      where: { rol: RolUsuario.MESERO, estado: EstadoEmpleado.ACTIVO, estadoSolicitud: EstadoSolicitud.APROBADO },
    });
  }
}
