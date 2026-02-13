import type {
  ClienteBasicInfo,
  CrearClienteConCuentaData,
} from '../../../types';

export interface ClientePort {
  /**
   * Side effects:
   * - Crea registro en módulo IDENTIDAD con tipo_cliente = CON_CUENTA
   */
  crearClienteConCuenta(
    datos: CrearClienteConCuentaData,
  ): Promise<{ clienteId: string }>;

  buscarPorId(clienteId: string): Promise<ClienteBasicInfo | null>;
}
