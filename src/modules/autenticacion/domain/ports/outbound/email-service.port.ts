/**
 * Puerto para envío de emails transaccionales.
 * Abstrae el proveedor de email (COMUNICACION module).
 */
export interface EmailService {
  /**
   * Side effects:
   * - Envía email asíncrono vía módulo COMUNICACION
   */
  enviarEmailVerificacion(
    email: string,
    nombre: string,
    token: string,
  ): Promise<void>;

  enviarEmailRecuperacionPassword(
    email: string,
    nombre: string,
    token: string,
  ): Promise<void>;

  enviarEmailCuentaEmpleadoCreada(
    email: string,
    nombre: string,
    passwordTemporal: string,
  ): Promise<void>;

  enviarEmailCuentaBloqueada(
    email: string,
    nombre: string,
    bloqueadoHasta: Date,
  ): Promise<void>;

  enviarEmailCuentaDesbloqueada(email: string, nombre: string): Promise<void>;
}
