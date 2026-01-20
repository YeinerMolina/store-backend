import { UUID } from '../../../../../shared/domain/value-objects/uuid.vo';
import { Venta } from '../../aggregates/venta.aggregate';

/**
 * PUERTO INBOUND (Driving Port)
 * Define el contrato de los casos de uso del módulo COMERCIAL
 * Los adaptadores primarios (controllers) dependen de esta interfaz
 */
export interface IVentaService {
  /**
   * CU-COM-01: Crear Venta desde Carrito
   */
  crearDesdeCarrito(carritoId: UUID, clienteId: UUID): Promise<Venta>;

  /**
   * CU-COM-02: Confirmar Venta (Pago Exitoso)
   */
  confirmarVenta(ventaId: UUID): Promise<Venta>;

  /**
   * Obtener venta por ID
   */
  obtenerPorId(ventaId: UUID): Promise<Venta | null>;

  /**
   * Listar ventas de un cliente
   */
  listarPorCliente(clienteId: UUID): Promise<Venta[]>;
}
