import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';
import type { TransactionManager } from '../../domain/ports/outbound/transaction-manager.port';
import type { PrismaTransactionClient } from './types/prisma-transaction.type';

/**
 * Prisma maneja commit/rollback automáticamente según resultado del callback.
 */
@Injectable()
export class PrismaTransactionManager implements TransactionManager {
  constructor(private readonly prismaService: PrismaService) {}

  async transaction<T>(
    work: (ctx: PrismaTransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prismaService.prisma.$transaction(
      async (tx: PrismaTransactionClient) => {
        return await work(tx);
      },
    );
  }
}
