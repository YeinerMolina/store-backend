/**
 * Value Object base
 * Representa conceptos del negocio que no tienen identidad,
 * solo valor. Ej: Money, Email, Address
 */
export abstract class ValueObject<T> {
  protected readonly props: T;

  constructor(props: T) {
    this.props = props;
  }

  public equals(vo?: ValueObject<T>): boolean {
    if (vo === undefined || vo === null) {
      return false;
    }
    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }

  public unpack(): T {
    return this.props;
  }
}
