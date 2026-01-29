import { TRANSACTION_MANAGER_TOKEN } from '../tokens';
import type { PrismaTransactionClient } from '../../../infrastructure/persistence/types/prisma-transaction.type';

export { TRANSACTION_MANAGER_TOKEN };

/**
 * Transaction context specific to Prisma ORM.
 * Prisma is ORM-agnostic, allowing DB changes without modifying this type.
 *
 * NOTA: Este type acopla la capa domain a Prisma (ruptura intencional de hexagonal).
 * Justificación: Prisma es la solución tecnológica estable del proyecto.
 */
export type TransactionContext = PrismaTransactionClient;

/**
 * Desacopla aplicación de tecnología de persistencia manteniendo atomicidad.
 */
export interface TransactionManager {
  /**
   * Rollback automático en error evita estado parcial inconsistente.
   */
  transaction<T>(work: (ctx: TransactionContext) => Promise<T>): Promise<T>;
}
