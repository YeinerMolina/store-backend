import type { InformacionCuenta } from '../../types';

/**
 * Puerto inbound para operaciones administrativas sobre cuentas.
 * Solo ejecutable por administradores.
 */
export interface AdminCuentaService {
  /**
   * Side effects:
   * - Cambia estado a ACTIVA
   * - Resetea intentos_fallidos y bloqueado_hasta
   * - Registra en LogAutenticacion quién realizó el desbloqueo
   *
   * @param accountId - ID de la cuenta a desbloquear
   * @param empleadoId - ID del empleado que realiza el desbloqueo (para auditoría)
   */
  desbloquearCuenta(accountId: string, empleadoId: string): Promise<void>;

  obtenerInformacionCuenta(accountId: string): Promise<InformacionCuenta>;
}
