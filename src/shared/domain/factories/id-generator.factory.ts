import { UUID } from '../value-objects/uuid.vo';

/**
 * Factory para generación de IDs en el dominio.
 * Proporciona API simple para casos donde no se necesita el Value Object completo.
 */
export class IdGenerator {
  static generate(): string {
    return UUID.generate().toString();
  }
}

export const generateId = (): string => IdGenerator.generate();
