import type {
  RegistrarClienteData,
  CrearCuentaEmpleadoData,
  CrearCuentaResult,
} from '../../types';

/**
 * Puerto inbound para registro de nuevas cuentas (clientes y empleados).
 */
export interface RegistroCuentaService {
  /**
   * Side effects:
   * - Crea Cliente en módulo IDENTIDAD
   * - Genera token de verificación de email
   * - Envía email de verificación vía COMUNICACION
   */
  registrarCliente(data: RegistrarClienteData): Promise<CrearCuentaResult>;

  /**
   * Solo ejecutable por admin/empleado con permiso.
   *
   * Side effects:
   * - Crea cuenta con estado ACTIVA y email_verificado = true
   * - ultimo_cambio_password = NULL (forzará cambio en primer login)
   * - Registra en LogAutenticacion quién creó la cuenta (admin_id)
   * - Envía email con instrucciones de primer login
   *
   * @param data - Datos de la cuenta a crear
   * @param empleadoId - ID del empleado/admin que crea la cuenta (para auditoría)
   */
  crearCuentaEmpleado(
    data: CrearCuentaEmpleadoData,
    empleadoId: string,
  ): Promise<CrearCuentaResult>;
}
