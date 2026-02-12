import type { TipoUsuario } from '../../aggregates/types';

export interface RegistrarClienteData {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  telefono?: string;
}

export interface LoginData {
  email: string;
  password: string;
  ip: string;
  userAgent: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userType: TipoUsuario;
  userId: string;
  requiereCambioPassword?: boolean;
}

export interface RefreshTokenData {
  refreshToken: string;
}

export interface VerificarEmailData {
  token: string;
}

export interface SolicitarRecuperacionData {
  email: string;
}

export interface EjecutarRecuperacionData {
  token: string;
  newPassword: string;
}

export interface CambiarPasswordData {
  currentPassword: string;
  newPassword: string;
  revocarOtrasSesiones?: boolean;
}

export interface CrearCuentaEmpleadoData {
  empleadoId: string;
  email: string;
  temporaryPassword: string;
}

export interface SesionInfo {
  id: string;
  dispositivo: string | null;
  fechaCreacion: Date;
  fechaUltimoUso: Date | null;
  fechaExpiracion: Date;
}
