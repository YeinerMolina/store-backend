import type { InformacionCuenta } from './autenticacion.types';

/**
 * Puerto inbound para operaciones administrativas sobre cuentas.
 * Solo ejecutable por administradores.
 */
export interface AdminCuentaService {
  /**
   * Side effects:
   * - Cambia estado a ACTIVA
   * - Resetea intentos_fallidos y bloqueado_hasta
   */
  desbloquearCuenta(accountId: string, adminId: string): Promise<void>;

  obtenerInformacionCuenta(accountId: string): Promise<InformacionCuenta>;
}
