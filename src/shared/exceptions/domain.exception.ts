/**
 * Excepción base para errores de dominio
 */
export abstract class DomainException extends Error {
  /**
   * Código único del error
   */
  abstract readonly code: string;

  /**
   * Código de estado HTTP sugerido
   */
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error cuando no hay stock suficiente para reservar
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

/**
 * Error de optimistic locking - versión de entidad ha cambiado
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

/**
 * Error cuando una entidad no se encuentra
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

/**
 * Error cuando el estado de una entidad no permite la operación
 */
export class EstadoInvalidoError extends DomainException {
  readonly code = 'ESTADO_INVALIDO';
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}

/**
 * Error cuando un empleado no tiene los permisos necesarios
 */
export class PermisoInsuficienteError extends DomainException {
  readonly code = 'PERMISO_INSUFICIENTE';
  readonly statusCode = 403;

  constructor(
    public readonly empleadoId: string,
    public readonly permiso: string,
  ) {
    super(
      `Empleado ${empleadoId} no tiene permiso ${permiso} para realizar esta operación`,
    );
  }
}
