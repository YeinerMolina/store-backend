import type { TokenRecuperacion as PrismaTokenRecuperacion } from '@prisma/client';
import { TokenRecuperacion } from '../../../domain/aggregates/token-recuperacion/token-recuperacion.entity';
import type { TokenRecuperacionProps } from '../../../domain/aggregates/token-recuperacion/token-recuperacion.types';
import {
  TipoTokenRecuperacion,
  EstadoToken,
} from '../../../domain/aggregates/types';

export class PrismaTokenRecuperacionMapper {
  static toPersistence(token: TokenRecuperacion) {
    return {
      id: token.id,
      cuentaUsuarioId: token.cuentaUsuarioId,
      tipoToken: token.tipoToken,
      tokenHash: token.tokenHash,
      estado: token.estado,
      fechaCreacion: token.fechaCreacion,
      fechaExpiracion: token.fechaExpiracion,
      fechaUso: token.fechaUso ?? null,
    };
  }

  static toDomain(prismaData: PrismaTokenRecuperacion): TokenRecuperacion {
    const props: TokenRecuperacionProps = {
      id: prismaData.id,
      cuentaUsuarioId: prismaData.cuentaUsuarioId,
      tipoToken: prismaData.tipoToken as TipoTokenRecuperacion,
      tokenHash: prismaData.tokenHash,
      estado: prismaData.estado as EstadoToken,
      fechaCreacion: prismaData.fechaCreacion,
      fechaExpiracion: prismaData.fechaExpiracion,
      fechaUso: prismaData.fechaUso,
    };

    return TokenRecuperacion.desde(props);
  }
}
