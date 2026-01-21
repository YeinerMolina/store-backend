export class Version {
  private readonly numero: number;

  private constructor(numero: number) {
    if (numero < 1) {
      throw new Error('Version debe ser >= 1');
    }
    this.numero = numero;
  }

  static crear(numero: number): Version {
    return new Version(numero);
  }

  static inicial(): Version {
    return new Version(1);
  }

  incrementar(): Version {
    return new Version(this.numero + 1);
  }

  obtenerNumero(): number {
    return this.numero;
  }

  esIgualA(otra: Version): boolean {
    return this.numero === otra.numero;
  }
}
