import { DomainException } from '../../../../shared/exceptions/domain.exception';

/**
 * Conflicto de concurrencia (Optimistic Locking)
 * El cliente debe reintentar con datos frescos
 */
export class OptimisticLockingError extends DomainException {
  readonly code = 'OPTIMISTIC_LOCK_CONFLICT';
  readonly statusCode = 409;

  constructor(
    public readonly entityName: string,
    public readonly entityId: string,
  ) {
    super(
      `Conflicto de concurrencia en ${entityName} ${entityId}. La entidad fue modificada por otro proceso. Intente nuevamente.`,
    );
  }
}
