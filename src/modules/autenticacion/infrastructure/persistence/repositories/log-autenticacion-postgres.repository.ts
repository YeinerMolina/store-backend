import { Injectable } from '@nestjs/common';
import type { LogAutenticacion as PrismaLogAutenticacion } from '@prisma/client';
import { LogAutenticacion } from '../../../domain/aggregates/log-autenticacion/log-autenticacion.entity';
import type { LogAutenticacionRepository } from '../../../domain/ports/outbound/repositories';
import { PrismaLogAutenticacionMapper } from '../mappers/prisma-log-autenticacion.mapper';
import {
  PrismaService,
  type PrismaTransactionClient,
  type TransactionContext,
} from '@shared/database';

/**
 * INSERT-only: logs inmutables para auditoría forense.
 * TransactionContext permite rollback conjunto con CuentaUsuario si alguna operación falla.
 */
@Injectable()
export class LogAutenticacionPostgresRepository implements LogAutenticacionRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async guardar(
    log: LogAutenticacion,
    ctx?: TransactionContext,
  ): Promise<void> {
    const persistenceData = PrismaLogAutenticacionMapper.toPersistence(log);

    const client = (ctx ?? this.prismaService) as PrismaTransactionClient;

    await client.logAutenticacion.create({
      data: {
        id: persistenceData.id,
        emailIntento: persistenceData.emailIntento,
        cuentaUsuarioId: persistenceData.cuentaUsuarioId,
        tipoEvento: persistenceData.tipoEvento,
        resultado: persistenceData.resultado,
        motivoFallo: persistenceData.motivoFallo,
        userAgent: persistenceData.userAgent,
        metadata: persistenceData.metadata ?? undefined,
        fechaEvento: persistenceData.fechaEvento,
      },
    });
  }

  async buscarPorId(
    id: string,
    ctx?: TransactionContext,
  ): Promise<LogAutenticacion | null> {
    const client = (ctx ?? this.prismaService) as PrismaTransactionClient;

    const data = await client.logAutenticacion.findUnique({
      where: { id },
    });

    return data ? this.reconstituir(data) : null;
  }

  async buscarPorCuentaUsuarioId(
    cuentaUsuarioId: string,
    limite = 50,
    ctx?: TransactionContext,
  ): Promise<LogAutenticacion[]> {
    const client = (ctx ?? this.prismaService) as PrismaTransactionClient;

    const results = await client.logAutenticacion.findMany({
      where: { cuentaUsuarioId },
      orderBy: { fechaEvento: 'desc' },
      take: limite,
    });

    return results.map((data) => this.reconstituir(data));
  }

  async buscarPorEmail(
    email: string,
    limite = 50,
    ctx?: TransactionContext,
  ): Promise<LogAutenticacion[]> {
    const client = (ctx ?? this.prismaService) as PrismaTransactionClient;

    const results = await client.logAutenticacion.findMany({
      where: { emailIntento: email },
      orderBy: { fechaEvento: 'desc' },
      take: limite,
    });

    return results.map((data) => this.reconstituir(data));
  }

  private reconstituir(data: PrismaLogAutenticacion): LogAutenticacion {
    return PrismaLogAutenticacionMapper.toDomain(data);
  }
}
