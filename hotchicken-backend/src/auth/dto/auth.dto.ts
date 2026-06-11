import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// ─── DTO de Login ───
export class LoginDto {
  @ApiProperty({ example: 'admin', description: 'Nombre de usuario' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'Admin1234', description: 'Contraseña' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

// ─── DTO de Solicitud de Registro (formulario público del mesero) ───
export class RegistroSolicitudDto {
  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre completo del solicitante' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombreCompleto: string;

  @ApiProperty({ example: 'jperez_01', description: 'Username deseado' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'El username solo puede contener letras, números y guiones bajos',
  })
  username: string;

  @ApiProperty({
    example: 'Pass1234',
    description: 'Contraseña propuesta (mínimo 8 caracteres)',
  })
  @IsString()
  @MinLength(8)
  password: string;
}
