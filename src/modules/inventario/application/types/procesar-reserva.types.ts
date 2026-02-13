import type {
  Inventario,
  MovimientoInventario,
  Reserva,
} from '@inventario/domain/aggregates/inventario';
import { TransactionContext } from '@shared/database';

/**
 * Result of a domain operation on a reservation.
 * Returns inventory to allow event capture after transaction commit.
 */
export interface OperacionReservaResult {
  inventario: Inventario;
  movimiento: MovimientoInventario;
}

/**
 * Executes domain logic on the Inventario aggregate for a specific reservation.
 * Must return both the modified inventory (with pending domain events) and
 * the generated movement for proper persistence and event publishing.
 */
export type OperacionReservaFn = (
  inventario: Inventario,
  reserva: Reserva,
) => OperacionReservaResult;

/**
 * Parameters for processing a single reservation.
 * Centralizes shared logic between consolidation, expiration, and cancellation.
 */
export interface ProcesarReservaParams {
  reserva: Reserva;
  operacion: OperacionReservaFn;
  /**
   * When provided, reuses existing transaction for atomicity across multiple reservations.
   * When undefined, repository creates isolated transaction per reservation.
   */
  transactionContext?: TransactionContext;
}
