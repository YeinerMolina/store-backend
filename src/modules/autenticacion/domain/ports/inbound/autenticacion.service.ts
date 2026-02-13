import type { LoginData, LoginResult, RefreshTokenData } from '../../types';

/**
 * Puerto inbound para autenticación (login/logout/refresh).
 */
export interface AutenticacionService {
  /**
   * Side effects:
   * - Actualiza ultimo_login y resetea intentos_fallidos si exitoso
   * - Incrementa intentos_fallidos y puede bloquear cuenta si falla
   * - Crea sesión activa con refresh token hasheado
   * - Emite LoginExitoso o LoginFallido
   */
  login(data: LoginData): Promise<LoginResult>;

  /**
   * Rotación automática: invalida refresh token anterior.
   *
   * Side effects:
   * - Actualiza sesión con nuevo refresh_token_hash
   * - Extiende fecha_expiracion de la sesión
   */
  refreshToken(data: RefreshTokenData): Promise<LoginResult>;

  /**
   * Side effects:
   * - Revoca sesión (estado = REVOCADA)
   */
  logout(refreshToken: string): Promise<void>;
}
