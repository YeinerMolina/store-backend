import { v7 as uuidv7, validate as uuidValidate } from 'uuid';

/**
 * Value Object para UUID v7 (RFC 9562)
 *
 * UUID v7 proporciona ordenamiento temporal y mejor rendimiento en índices PostgreSQL.
 *
 * Estructura:
 * - 48 bits: Unix timestamp en milisegundos
 * - 12 bits: subsecond precision
 * - 62 bits: random data
 * - 6 bits: version + variant
 */
export class UUID {
  private readonly value: string;

  private constructor(value: string) {
    if (!uuidValidate(value)) {
      throw new Error(`UUID inválido: ${value}`);
    }
    this.value = value;
  }

  static generate(): UUID {
    return new UUID(uuidv7());
  }

  static fromString(value: string): UUID {
    return new UUID(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: UUID): boolean {
    return this.value === other.value;
  }
}
