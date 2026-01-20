import { UUID } from '../../../../../shared/domain/value-objects/uuid.vo';

/**
 * PUERTO OUTBOUND (Driven Port)
 * Define el contrato para comunicación con el módulo INVENTARIO
 * El adaptador de infraestructura implementa esta interfaz
 */

export interface DisponibilidadResult {
  itemId: UUID;
  disponible: boolean;
  cantidadDisponible: number;
}

export interface ReservaParams {
  itemId: UUID;
  cantidad: number;
  motivoReserva: string;
  ventaId?: UUID;
}

export interface IInventarioPort {
  /**
   * Verificar disponibilidad de un ítem
   */
  verificarDisponibilidad(itemId: UUID, cantidad: number): Promise<boolean>;

  /**
   * Verificar disponibilidad de múltiples ítems
   */
  verificarDisponibilidadMultiple(
    items: Array<{ itemId: UUID; cantidad: number }>,
  ): Promise<DisponibilidadResult[]>;

  /**
   * Reservar inventario (20 minutos)
   */
  reservar(params: ReservaParams): Promise<UUID>; // retorna reservaId

  /**
   * Consolidar reserva (cuando venta se confirma)
   */
  consolidarReserva(reservaId: UUID): Promise<void>;

  /**
   * Cancelar reserva (si venta se cancela)
   */
  cancelarReserva(reservaId: UUID): Promise<void>;
}
