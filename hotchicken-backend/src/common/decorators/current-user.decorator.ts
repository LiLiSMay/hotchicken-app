import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorador @CurrentUser()
 * Extrae el usuario autenticado del request (inyectado por JwtStrategy)
 *
 * Uso en controlador:
 *   @Get('perfil')
 *   getPerfil(@CurrentUser() user: JwtPayload) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
