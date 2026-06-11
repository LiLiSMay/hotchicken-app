import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto, RegistroSolicitudDto } from './dto/auth.dto';
import { EstadoSolicitud, EstadoEmpleado } from '../common/enums';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // ─── Login ───
  async login(dto: LoginDto) {
    const usuario = await this.usersService.findByUsername(dto.username);

    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Verificar que la solicitud esté aprobada
    if (usuario.estadoSolicitud !== EstadoSolicitud.APROBADO) {
      if (usuario.estadoSolicitud === EstadoSolicitud.PENDIENTE) {
        throw new ForbiddenException(
          'Tu solicitud de acceso está pendiente de aprobación por el administrador',
        );
      }
      throw new ForbiddenException(
        `Tu acceso fue rechazado. Motivo: ${usuario.motivoRechazo || 'Consulta con el administrador'}`,
      );
    }

    // Verificar que el usuario esté activo
    if (usuario.estado === EstadoEmpleado.INACTIVO) {
      throw new ForbiddenException('Tu cuenta está desactivada. Contacta al administrador');
    }

    // Verificar contraseña
    const passwordValida = await bcrypt.compare(dto.password, usuario.password);
    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Generar token JWT
    const payload: JwtPayload = {
      sub: usuario.id,
      username: usuario.username,
      rol: usuario.rol,
    };

    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      usuario: {
        id: usuario.id,
        nombreCompleto: usuario.nombreCompleto,
        username: usuario.username,
        rol: usuario.rol,
      },
    };
  }

  // ─── Registro público (solicitud del mesero nuevo) ───
  async registrarSolicitud(dto: RegistroSolicitudDto) {
    const solicitud = await this.usersService.registrarSolicitud({
      nombreCompleto: dto.nombreCompleto,
      username: dto.username,
      password: dto.password,
    });

    return {
      mensaje:
        '¡Solicitud enviada exitosamente! El administrador revisará tu cuenta.',
      id: solicitud.id,
      nombreCompleto: solicitud.nombreCompleto,
      estadoSolicitud: solicitud.estadoSolicitud,
    };
  }
}
