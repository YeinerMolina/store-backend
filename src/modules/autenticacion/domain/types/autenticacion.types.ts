import { TipoUsuario } from '../aggregates';

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

export interface InformacionCuenta {
  accountId: string;
  email: string;
  tipoUsuario: string;
  userId: string;
  emailVerificado: boolean;
  ultimoLogin: Date | null;
}

/**
 * Resultado de crear una nueva sesión de usuario.
 * Retorna tokens de acceso y refresco sin incluir la entidad sesión.
 */
export interface CrearSesionResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Resultado de generar una nueva sesión completa.
 * Incluye tokens, tiempo de expiración y la entidad sesión creada.
 * Usado internamente para operaciones que requieren la sesión (login, refreshToken).
 */
export interface GenerarSesionResult {
  accessToken: string;
  refreshToken: string;
  sesion: import('../aggregates/sesion-usuario/sesion-usuario.entity').SesionUsuario;
  expiresIn: number;
}

/**
 * Resultado de crear un token de recuperación.
 * Retorna el token en texto plano (para enviar al usuario) y la entidad TokenRecuperacion.
 */
export interface CrearTokenRecuperacionResult {
  token: string;
  tokenRecuperacion: import('../aggregates/token-recuperacion/token-recuperacion.entity').TokenRecuperacion;
}

/**
 * Resultado de operaciones de registro de cuenta.
 * Retorna el ID de la cuenta creada.
 */
export interface CrearCuentaResult {
  accountId: string;
}
