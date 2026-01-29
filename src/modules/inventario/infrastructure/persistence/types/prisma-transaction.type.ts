import type { PrismaClient } from '@prisma/client';

/**
 * Contexto transaccional de Prisma.
 * Prisma pasa el cliente completo con mismo API dentro de transacciones.
 */
export type PrismaTransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;
