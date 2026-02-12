/**
 * Puerto para interacción con módulo IDENTIDAD (gestión de Clientes).
 */
export interface ClientePort {
  /**
   * Side effects:
   * - Crea registro en módulo IDENTIDAD con tipo_cliente = CON_CUENTA
   */
  crearClienteConCuenta(datos: {
    email: string;
    nombre: string;
    apellido: string;
    telefono?: string;
  }): Promise<{ clienteId: string }>;

  buscarPorId(clienteId: string): Promise<{
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  } | null>;
}
