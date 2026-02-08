import { TRANSACTION_MANAGER_TOKEN } from '../tokens';
/**
 * Direct coupling to Prisma transaction type because the ORM is architecturally
 * stable and unlikely to change. Abstracting PrismaTransactionClient adds
 * unnecessary indirection without meaningful testability or swappability benefits.
 *
 * This pragmatic decision prioritizes simplicity over theoretical purity:
 * - Prisma's transaction API is mature and won't change
 * - Migration to another ORM is not on the roadmap
 * - Type-safe transactions prevent runtime errors
 */
import type { PrismaTransactionClient } from '../../../infrastructure/persistence/types/prisma-transaction.type';

export type TransactionContext = PrismaTransactionClient;

export interface TransactionManager {
  transaction<T>(
    callback: (context: TransactionContext) => Promise<T>,
  ): Promise<T>;
}
