import { SetMetadata } from '@nestjs/common';
import { RolUsuario } from '../enums';

export const ROLES_KEY = 'roles';

/**
 * Decorador @Roles()
 * Define qué roles tienen acceso a una ruta
 *
 * Uso:
 *   @Roles(RolUsuario.ADMIN)
 *   @Get('empleados')
 *   getEmpleados() { ... }
 */
export const Roles = (...roles: RolUsuario[]) => SetMetadata(ROLES_KEY, roles);
