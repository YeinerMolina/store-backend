export interface EmailService {
  /**
   * Envío asíncrono vía módulo COMUNICACION sin esperar confirmación de entrega.
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
