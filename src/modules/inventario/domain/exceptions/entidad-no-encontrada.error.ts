import { DomainException } from '../../../../shared/exceptions/domain.exception';

/**
 * Entidad no encontrada en la base de datos
 */
export class EntidadNoEncontradaError extends DomainException {
  readonly code = 'ENTIDAD_NO_ENCONTRADA';
  readonly statusCode = 404;

  constructor(
    public readonly entityName: string,
    public readonly entityId: string,
  ) {
    super(`${entityName} no encontrado: ${entityId}`);
  }
}
