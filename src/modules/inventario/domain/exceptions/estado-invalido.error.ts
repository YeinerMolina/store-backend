import { DomainException } from '../../../../shared/exceptions/domain.exception';

/**
 * Transición de estado no permitida por reglas de negocio
 */
export class EstadoInvalidoError extends DomainException {
  readonly code = 'ESTADO_INVALIDO';
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}
