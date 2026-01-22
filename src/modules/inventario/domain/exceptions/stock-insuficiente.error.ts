import { DomainException } from '../../../../shared/exceptions/domain.exception';

/**
 * Stock insuficiente para completar la operación
 */
export class StockInsuficienteError extends DomainException {
  readonly code = 'STOCK_INSUFICIENTE';
  readonly statusCode = 409;

  constructor(
    public readonly disponible: number,
    public readonly solicitado: number,
  ) {
    super(
      `Stock insuficiente: disponible ${disponible}, solicitado ${solicitado}`,
    );
  }
}
