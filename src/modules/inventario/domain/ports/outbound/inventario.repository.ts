import { Inventario } from '../../aggregates/inventario/inventario.entity';
import { Reserva } from '../../aggregates/inventario/reserva.entity';
import { MovimientoInventario } from '../../aggregates/inventario/movimiento-inventario.entity';
import { INVENTARIO_REPOSITORY_TOKEN } from '../tokens';

export { INVENTARIO_REPOSITORY_TOKEN };

/**
 * Replaces callback pattern with declarative options.
 * All specified entities persist within a single database transaction.
 */
export interface GuardarInventarioOptions {
  reservas?: {
    nuevas?: Reserva[];
    actualizadas?: Reserva[];
  };
  movimientos?: MovimientoInventario[];
}

/**
 * Enforces DDD principle: one aggregate = one repository.
 * Internal entities must NOT be persisted outside this repository.
 */
export interface InventarioRepository {
  /**
   * Uses version-based optimistic locking to prevent lost updates
   * when multiple processes modify the same inventory simultaneously.
   *
   * All operations execute atomically within a single transaction;
   * if any fails, everything rolls back to prevent partial state.
   *
   * @throws {OptimisticLockingError} When version mismatch detected
   */
  guardar(
    inventario: Inventario,
    options?: GuardarInventarioOptions,
  ): Promise<void>;

  buscarPorId(id: string): Promise<Inventario | null>;
  buscarPorItem(tipoItem: string, itemId: string): Promise<Inventario | null>;
  buscarTodos(): Promise<Inventario[]>;

  buscarReservasActivas(operacionId: string): Promise<Reserva[]>;

  /**
   * Queries only ACTIVA state to avoid re-processing reservations
   * already handled by previous job executions.
   */
  buscarReservasExpiradas(): Promise<Reserva[]>;

  buscarReservasPorInventario(inventarioId: string): Promise<Reserva[]>;

  buscarMovimientos(
    inventarioId: string,
    limit?: number,
    offset?: number,
  ): Promise<MovimientoInventario[]>;
}
