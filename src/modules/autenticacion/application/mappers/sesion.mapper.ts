import type { SesionUsuario } from '../../domain/aggregates/sesion-usuario/sesion-usuario.entity';
import type { SesionResponseDto } from '../dto/sesion-response.dto';
import type { SesionInfo } from '../../domain/types';

export class SesionMapper {
  static toResponseDto(sesion: SesionUsuario): SesionResponseDto {
    return {
      id: sesion.id,
      dispositivo: sesion.dispositivo,
      fechaCreacion: sesion.fechaCreacion.toISOString(),
      fechaUltimoUso: sesion.fechaUltimoUso?.toISOString() ?? null,
      fechaExpiracion: sesion.fechaExpiracion.toISOString(),
    };
  }

  static toSesionInfo(sesion: SesionUsuario): SesionInfo {
    return {
      id: sesion.id,
      dispositivo: sesion.dispositivo,
      fechaCreacion: sesion.fechaCreacion,
      fechaUltimoUso: sesion.fechaUltimoUso,
      fechaExpiracion: sesion.fechaExpiracion,
    };
  }

  static toResponseDtoList(sesiones: SesionUsuario[]): SesionResponseDto[] {
    return sesiones.map((s) => this.toResponseDto(s));
  }
}
