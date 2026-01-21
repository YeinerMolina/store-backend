export class Cantidad {
  private readonly valor: number;

  private constructor(valor: number) {
    if (valor < 0) {
      throw new Error('Cantidad no puede ser negativa');
    }
    this.valor = valor;
  }

  static crear(valor: number): Cantidad {
    return new Cantidad(valor);
  }

  static zero(): Cantidad {
    return new Cantidad(0);
  }

  sumar(otra: Cantidad): Cantidad {
    return new Cantidad(this.valor + otra.valor);
  }

  restar(otra: Cantidad): Cantidad {
    return new Cantidad(this.valor - otra.valor);
  }

  esIgualA(otra: Cantidad): boolean {
    return this.valor === otra.valor;
  }

  esMayorA(otra: Cantidad): boolean {
    return this.valor > otra.valor;
  }

  esMenorA(otra: Cantidad): boolean {
    return this.valor < otra.valor;
  }

  esMayorOIgualA(otra: Cantidad): boolean {
    return this.valor >= otra.valor;
  }

  obtenerValor(): number {
    return this.valor;
  }
}
