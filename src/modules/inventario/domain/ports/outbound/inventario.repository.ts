import { Inventario } from '../../aggregates/inventario/inventario.entity';
import { Reserva } from '../../aggregates/inventario/reserva.entity';
import { MovimientoInventario } from '../../aggregates/inventario/movimiento-inventario.entity';
import { INVENTARIO_REPOSITORY_TOKEN } from '../tokens';

export { INVENTARIO_REPOSITORY_TOKEN };

/**
 * Declarative options ensure all entities persist atomically in single transaction.
 */
export interface GuardarInventarioOptions {
  reservas?: {
    nuevas?: Reserva[];
    actualizadas?: Reserva[];
  };
  movimientos?: MovimientoInventario[];
}

export interface InventarioRepository {
  /**
   * Version-based optimistic locking prevents lost updates when multiple processes modify simultaneously.
   *
   * @throws OptimisticLockingError
   */
  guardar(
    inventario: Inventario,
    options?: GuardarInventarioOptions,
  ): Promise<void>;

  buscarPorId(id: string): Promise<Inventario | null>;
  buscarPorItem(tipoItem: string, itemId: string): Promise<Inventario | null>;
  buscarTodos(): Promise<Inventario[]>;
  buscarInventariosBajoUmbral(umbral: number): Promise<Inventario[]>;

  buscarReservasActivas(operacionId: string): Promise<Reserva[]>;

  /**
   * ACTIVA filter avoids re-processing reservations already handled by previous job runs.
   */
  buscarReservasExpiradas(): Promise<Reserva[]>;

  buscarReservasPorInventario(inventarioId: string): Promise<Reserva[]>;

  buscarMovimientos(
    inventarioId: string,
    limit?: number,
    offset?: number,
  ): Promise<MovimientoInventario[]>;
}
