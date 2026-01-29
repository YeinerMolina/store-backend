import { TRANSACTION_MANAGER_TOKEN } from '../tokens';

export { TRANSACTION_MANAGER_TOKEN };

/**
 * Contexto transaccional genérico para mantener independencia de tecnología.
 * Implementaciones concretas definen tipo específico (Prisma, TypeORM, etc).
 */
export type TransactionContext = unknown;

/**
 * Desacopla aplicación de tecnología de persistencia manteniendo atomicidad.
 */
export interface TransactionManager {
  /**
   * Rollback automático en error evita estado parcial inconsistente.
   */
  transaction<T>(work: (ctx: TransactionContext) => Promise<T>): Promise<T>;
}
