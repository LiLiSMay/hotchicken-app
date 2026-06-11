import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegistroSolicitudDto } from './dto/auth.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/v1/auth/login
   * Ruta pública - no requiere token
   * Devuelve el JWT y datos básicos del usuario
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión en el sistema' })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso, retorna el token JWT',
  })
  @ApiResponse({ status: 401, description: 'Credenciales incorrectas' })
  @ApiResponse({ status: 403, description: 'Cuenta pendiente o desactivada' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * POST /api/v1/auth/registro
   * Ruta pública - El mesero llena el formulario de registro
   * La cuenta queda PENDIENTE hasta que el admin la apruebe
   */
  @Public()
  @Post('registro')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Solicitar registro (mesero nuevo)',
    description:
      'Crea una solicitud pendiente. El administrador debe aprobarla para que el usuario pueda iniciar sesión.',
  })
  @ApiResponse({
    status: 201,
    description: 'Solicitud enviada, pendiente de aprobación',
  })
  @ApiResponse({ status: 409, description: 'El username ya está en uso' })
  registrarSolicitud(@Body() dto: RegistroSolicitudDto) {
    return this.authService.registrarSolicitud(dto);
  }
}
