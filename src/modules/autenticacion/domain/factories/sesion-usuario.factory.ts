import { IdGenerator } from '@shared/domain/factories';
import { SesionUsuario } from '../aggregates/sesion-usuario/sesion-usuario.entity';
import { EstadoSesion } from '../aggregates/types';
import type {
  CrearSesionUsuarioProps,
  SesionUsuarioProps,
} from '../aggregates/sesion-usuario/sesion-usuario.types';

export class SesionUsuarioFactory {
  /**
   * Side effects:
   * - Genera ID con UUID v7
   * - Inicializa fechaCreacion
   * - Estado inicial: ACTIVA
   */
  static crear(props: CrearSesionUsuarioProps): SesionUsuario {
    const sesionProps: SesionUsuarioProps = {
      id: IdGenerator.generate(),
      cuentaUsuarioId: props.cuentaUsuarioId,
      refreshTokenHash: props.refreshTokenHash,
      dispositivo: props.dispositivo ?? null,
      estado: EstadoSesion.ACTIVA,
      fechaCreacion: new Date(),
      fechaExpiracion: props.fechaExpiracion,
      fechaUltimoUso: null,
      fechaRevocacion: null,
      revocadaPor: null,
      motivoRevocacion: null,
    };

    return SesionUsuario.desde(sesionProps);
  }
}
