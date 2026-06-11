import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { RolUsuario, EstadoEmpleado, EstadoSolicitud } from '../../common/enums';

// ─── Crear empleado (desde panel admin) ───
export class CreateUsuarioDto {
  @ApiProperty({ example: 'María López', description: 'Nombre completo del empleado' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombreCompleto: string;

  @ApiProperty({ example: 'mlopez', description: 'Nombre de usuario único' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'El username solo puede contener letras, números y guiones bajos',
  })
  username: string;

  @ApiProperty({ example: 'Pass1234', description: 'Contraseña (mínimo 8 caracteres)' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ enum: RolUsuario, default: RolUsuario.MESERO })
  @IsOptional()
  @IsEnum(RolUsuario)
  rol?: RolUsuario;

  @ApiPropertyOptional({ enum: EstadoEmpleado, default: EstadoEmpleado.ACTIVO })
  @IsOptional()
  @IsEnum(EstadoEmpleado)
  estado?: EstadoEmpleado;
}

// ─── Actualizar empleado (campos opcionales) ───
export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {
  @ApiPropertyOptional({ enum: EstadoEmpleado })
  @IsOptional()
  @IsEnum(EstadoEmpleado)
  estado?: EstadoEmpleado;
}

// ─── Aprobar/Rechazar solicitud de registro ───
export class GestionarSolicitudDto {
  @ApiProperty({ enum: EstadoSolicitud, example: EstadoSolicitud.APROBADO })
  @IsEnum(EstadoSolicitud)
  estadoSolicitud: EstadoSolicitud;

  @ApiPropertyOptional({
    example: 'Datos incompletos',
    description: 'Requerido solo si se rechaza la solicitud',
  })
  @IsOptional()
  @IsString()
  motivoRechazo?: string;

  @ApiPropertyOptional({
    example: 'mlopez_01',
    description: 'Username asignado por el admin al aprobar',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  usernameAsignado?: string;

  @ApiPropertyOptional({
    example: 'Pass1234',
    description: 'Contraseña asignada por el admin al aprobar',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  passwordAsignada?: string;
}
