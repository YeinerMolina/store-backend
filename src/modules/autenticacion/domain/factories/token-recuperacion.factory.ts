import { IdGenerator } from '@shared/domain/factories';
import { TokenRecuperacion } from '../aggregates/token-recuperacion/token-recuperacion.entity';
import { EstadoToken } from '../aggregates/types';
import type {
  CrearTokenRecuperacionProps,
  TokenRecuperacionProps,
} from '../aggregates/token-recuperacion/token-recuperacion.types';

export class TokenRecuperacionFactory {
  /**
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
    };

    return TokenRecuperacion.desde(tokenProps);
  }
}
