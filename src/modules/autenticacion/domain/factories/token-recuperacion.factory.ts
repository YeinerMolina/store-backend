import { IdGenerator } from '@shared/domain/factories';
import { TokenRecuperacion } from '../aggregates/cuenta-usuario/token-recuperacion.entity';
import { EstadoToken } from '../aggregates/cuenta-usuario/types';
import type {
  CrearTokenRecuperacionProps,
  TokenRecuperacionProps,
} from '../aggregates/cuenta-usuario/token-recuperacion.types';

export class TokenRecuperacionFactory {
  /**
   * Crea un nuevo token de recuperación o verificación.
   *
   * Side effects:
   * - Genera ID con UUID v7
   * - Inicializa fechaCreacion
   * - Estado inicial: PENDIENTE
   */
  static crear(props: CrearTokenRecuperacionProps): TokenRecuperacion {
    const tokenProps: TokenRecuperacionProps = {
      id: IdGenerator.generate(),
      cuentaUsuarioId: props.cuentaUsuarioId,
      tipoToken: props.tipoToken,
      tokenHash: props.tokenHash,
      estado: EstadoToken.PENDIENTE,
      fechaCreacion: new Date(),
      fechaExpiracion: props.fechaExpiracion,
      fechaUso: null,
      ipSolicitud: props.ipSolicitud ?? null,
      ipUso: null,
    };

    return TokenRecuperacion.reconstituir(tokenProps);
  }
}
