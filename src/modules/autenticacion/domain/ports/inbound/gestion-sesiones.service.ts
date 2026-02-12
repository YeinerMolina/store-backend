import type { SesionInfo } from './autenticacion.types';

/**
 * Puerto inbound para gestión de sesiones activas.
 */
export interface GestionSesionesService {
  /**
   * Side effects:
   * - Revoca TODAS las sesiones activas del usuario
   */
  revocarTodasLasSesiones(accountId: string): Promise<number>;

  obtenerSesionesActivas(accountId: string): Promise<SesionInfo[]>;

  /**
   * Side effects:
   * - Revoca sesión específica (estado = REVOCADA)
   */
  revocarSesion(sesionId: string, accountId: string): Promise<void>;
}
