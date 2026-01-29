import { DomainException } from '../../../../shared/exceptions/domain.exception';

/**
 * Intento de eliminar inventario que tiene items, movimientos o reservas asociados
 */
export class InventarioConDependenciasError extends DomainException {
  readonly code = 'INVENTARIO_CON_DEPENDENCIAS';
  readonly statusCode = 409;

  constructor(message: string) {
    super(message);
  }
}
