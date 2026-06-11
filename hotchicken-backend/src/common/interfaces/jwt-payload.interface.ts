import { RolUsuario } from '../enums';

export interface JwtPayload {
  sub: number;        // ID del usuario
  username: string;   // Nombre de usuario
  rol: RolUsuario;    // Rol para control de acceso
}

export interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    username: string;
    rol: RolUsuario;
  };
}
