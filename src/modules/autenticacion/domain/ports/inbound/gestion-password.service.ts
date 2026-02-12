import type {
  SolicitarRecuperacionData,
  EjecutarRecuperacionData,
  CambiarPasswordData,
} from './autenticacion.types';

/**
 * Puerto inbound para gestión de contraseñas.
 */
export interface GestionPasswordService {
  /**
   * Side effects:
   * - Genera token de recuperación con expiración de 1 hora
   * - Envía email con link de reset
   */
  solicitarRecuperacionPassword(data: SolicitarRecuperacionData): Promise<void>;

  /**
   * Side effects:
   * - Actualiza password_hash con nuevo bcrypt hash
   * - Revoca TODAS las sesiones activas (forzar re-login)
   * - Marca token como USADO
   * - Desbloquea cuenta si estaba bloqueada
   */
  ejecutarRecuperacionPassword(data: EjecutarRecuperacionData): Promise<void>;

  /**
   * Requiere autenticación previa (usuario debe proporcionar contraseña actual).
   *
   * Side effects:
   * - Actualiza password_hash
   * - Opcionalmente revoca otras sesiones
   */
  cambiarPassword(accountId: string, data: CambiarPasswordData): Promise<void>;
}
