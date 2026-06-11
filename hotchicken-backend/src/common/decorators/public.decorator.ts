import { SetMetadata } from '@nestjs/common';

/**
 * Decorador @Public()
 * Las rutas marcadas con este decorador no requieren token JWT
 *
 * Uso:
 *   @Public()
 *   @Post('login')
 *   login() { ... }
 */
export const Public = () => SetMetadata('isPublic', true);
