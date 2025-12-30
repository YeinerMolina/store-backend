/**
 * Excepción base de dominio
 * Cualquier error del negocio debe heredar de esta
 */
export class DomainException extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Excepción cuando un recurso no existe
 */
export class NotFoundException extends DomainException {
  constructor(resource: string, identifier: string | number) {
    super('NOT_FOUND', `${resource} with identifier "${identifier}" not found`);
  }
}

/**
 * Excepción cuando hay conflicto (ej: email duplicado)
 */
export class ConflictException extends DomainException {
  constructor(message: string) {
    super('CONFLICT', message);
  }
}

/**
 * Excepción cuando algo es inválido
 */
export class InvalidArgumentException extends DomainException {
  constructor(message: string) {
    super('INVALID_ARGUMENT', message);
  }
}

/**
 * Excepción cuando no hay suficientes recursos
 */
export class InsufficientException extends DomainException {
  constructor(resource: string, required: number, available: number) {
    super(
      'INSUFFICIENT_RESOURCE',
      `Insufficient ${resource}. Required: ${required}, Available: ${available}`,
    );
  }
}
