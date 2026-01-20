/**
 * Value Object: Money
 * Representa valores monetarios con precisión decimal
 * INMUTABLE - Operaciones retornan nuevas instancias
 */
export class Money {
  private readonly amount: number;
  private readonly currency: string;

  private constructor(amount: number, currency: string = 'ARS') {
    if (amount < 0) {
      throw new Error('Money amount cannot be negative');
    }
    // Redondear a 2 decimales para evitar problemas de precisión
    this.amount = Math.round(amount * 100) / 100;
    this.currency = currency;
  }

  static fromAmount(amount: number, currency: string = 'ARS'): Money {
    return new Money(amount, currency);
  }

  static zero(currency: string = 'ARS'): Money {
    return new Money(0, currency);
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount - other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount > other.amount;
  }

  isLessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount < other.amount;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): string {
    return this.currency;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(
        `Cannot operate on different currencies: ${this.currency} vs ${other.currency}`,
      );
    }
  }
}
