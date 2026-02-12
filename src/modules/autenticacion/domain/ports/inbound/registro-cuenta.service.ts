import type {
  RegistrarClienteData,
  CrearCuentaEmpleadoData,
} from './autenticacion.types';

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
  registrarCliente(data: RegistrarClienteData): Promise<{ accountId: string }>;

  /**
   * Solo ejecutable por admin/empleado con permiso.
   *
   * Side effects:
   * - Crea cuenta con estado ACTIVA y email_verificado = true
   * - ultimo_cambio_password = NULL (forzará cambio en primer login)
   * - Envía email con instrucciones de primer login
   */
  crearCuentaEmpleado(
    data: CrearCuentaEmpleadoData,
  ): Promise<{ accountId: string }>;
}
