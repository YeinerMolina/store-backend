import { randomUUID } from 'crypto';

/**
 * Value Object: UUID
 * Representa un identificador único universal (v4)
 * INMUTABLE - Una vez creado no se puede cambiar
 */
export class UUID {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(): UUID {
    return new UUID(randomUUID());
  }

  static fromString(value: string): UUID {
    if (!this.isValid(value)) {
      throw new Error(`Invalid UUID format: ${value}`);
    }
    return new UUID(value);
  }

  private static isValid(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: UUID): boolean {
    return this.value === other.value;
  }
}
