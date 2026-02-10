import type { SesionUsuario as PrismaSesionUsuario } from '@prisma/client';
import { SesionUsuario } from '../../../domain/aggregates/sesion-usuario/sesion-usuario.entity';
import type { SesionUsuarioProps } from '../../../domain/aggregates/sesion-usuario/sesion-usuario.types';
import { EstadoSesion } from '../../../domain/aggregates/types';

export class PrismaSesionUsuarioMapper {
  static toPersistence(sesion: SesionUsuario) {
    return {
      id: sesion.id,
      cuentaUsuarioId: sesion.cuentaUsuarioId,
      refreshTokenHash: sesion.refreshTokenHash,
      dispositivo: sesion.dispositivo ?? null,
      estado: sesion.estado,
      fechaCreacion: sesion.fechaCreacion,
      fechaExpiracion: sesion.fechaExpiracion,
      fechaUltimoUso: sesion.fechaUltimoUso ?? null,
      fechaRevocacion: sesion.fechaRevocacion ?? null,
      revocadaPor: sesion.revocadaPor ?? null,
      motivoRevocacion: sesion.motivoRevocacion ?? null,
    };
  }

  static toDomain(prismaData: PrismaSesionUsuario): SesionUsuario {
    const props: SesionUsuarioProps = {
      id: prismaData.id,
      cuentaUsuarioId: prismaData.cuentaUsuarioId,
      refreshTokenHash: prismaData.refreshTokenHash,
      dispositivo: prismaData.dispositivo,
      estado: prismaData.estado as EstadoSesion,
      fechaCreacion: prismaData.fechaCreacion,
      fechaExpiracion: prismaData.fechaExpiracion,
      fechaUltimoUso: prismaData.fechaUltimoUso,
      fechaRevocacion: prismaData.fechaRevocacion,
      revocadaPor: prismaData.revocadaPor,
      motivoRevocacion: prismaData.motivoRevocacion,
    };

    return SesionUsuario.desde(props);
  }
}
