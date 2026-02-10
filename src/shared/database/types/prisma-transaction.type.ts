import type { PrismaClient } from '@prisma/client';

/**
 * Prisma passes the full client with identical API inside transactions.
 * Omits methods that aren't available in transaction context.
 */
export type PrismaTransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;
