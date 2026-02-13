import type {
  LogAutenticacion as PrismaLogAutenticacion,
  Prisma,
} from '@prisma/client';
import { LogAutenticacion } from '../../../domain/aggregates/log-autenticacion/log-autenticacion.entity';
import {
  TipoEventoAuth,
  ResultadoAuth,
} from '../../../domain/aggregates/types';
import type { LogAutenticacionProps } from '../../../domain/aggregates/log-autenticacion/log-autenticacion.types';

export class PrismaLogAutenticacionMapper {
  static toDomain(prisma: PrismaLogAutenticacion): LogAutenticacion {
    const props: LogAutenticacionProps = {
      id: prisma.id,
      emailIntento: prisma.emailIntento,
      cuentaUsuarioId: prisma.cuentaUsuarioId,
      tipoEvento: prisma.tipoEvento as TipoEventoAuth,
      resultado: prisma.resultado as ResultadoAuth,
      motivoFallo: prisma.motivoFallo,
      userAgent: prisma.userAgent,
      metadata: prisma.metadata as Record<string, unknown> | null,
      fechaEvento: prisma.fechaEvento,
    };

    return LogAutenticacion.desde(props);
  }

  static toPersistence(
    domain: LogAutenticacion,
  ): Omit<PrismaLogAutenticacion, 'cuentaUsuario'> {
    return {
      id: domain.id,
      emailIntento: domain.emailIntento,
      cuentaUsuarioId: domain.cuentaUsuarioId,
      tipoEvento: domain.tipoEvento,
      resultado: domain.resultado,
      motivoFallo: domain.motivoFallo,
      userAgent: domain.userAgent,
      metadata: domain.metadata as Prisma.JsonValue,
      fechaEvento: domain.fechaEvento,
    };
  }
}
