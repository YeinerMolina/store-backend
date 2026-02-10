import type { PrismaTransactionClient } from '../types/prisma-transaction.type';

export type TransactionContext = PrismaTransactionClient;

export interface TransactionManager {
  transaction<T>(
    callback: (context: TransactionContext) => Promise<T>,
  ): Promise<T>;
}
