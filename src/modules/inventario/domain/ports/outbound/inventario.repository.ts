import { Inventario } from '../../aggregates/inventario/inventario.entity';
import { Reserva } from '../../aggregates/inventario/reserva.entity';
import { MovimientoInventario } from '../../aggregates/inventario/movimiento-inventario.entity';
import { INVENTARIO_REPOSITORY_TOKEN } from '../tokens';
import type { TransactionContext } from './transaction-manager.port';

export { INVENTARIO_REPOSITORY_TOKEN, TransactionContext };

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
   * Contexto transaccional opcional permite reutilizar transacción existente evitando anidación.
   *
   * @throws OptimisticLockingError
   */
  guardar(
    inventario: Inventario,
    options?: GuardarInventarioOptions,
    ctx?: TransactionContext,
  ): Promise<void>;

  buscarPorId(id: string, ctx?: TransactionContext): Promise<Inventario | null>;
  buscarPorItem(
    tipoItem: string,
    itemId: string,
    ctx?: TransactionContext,
  ): Promise<Inventario | null>;
  buscarTodos(ctx?: TransactionContext): Promise<Inventario[]>;
  buscarInventariosBajoUmbral(
    umbral: number,
    ctx?: TransactionContext,
  ): Promise<Inventario[]>;

  buscarReservasActivas(
    operacionId: string,
    ctx?: TransactionContext,
  ): Promise<Reserva[]>;

  /**
   * ACTIVA filter avoids re-processing reservations already handled by previous job runs.
   */
  buscarReservasExpiradas(ctx?: TransactionContext): Promise<Reserva[]>;

  buscarReservasPorInventario(
    inventarioId: string,
    ctx?: TransactionContext,
  ): Promise<Reserva[]>;

  buscarMovimientos(
    inventarioId: string,
    limit?: number,
    offset?: number,
    ctx?: TransactionContext,
  ): Promise<MovimientoInventario[]>;
}
