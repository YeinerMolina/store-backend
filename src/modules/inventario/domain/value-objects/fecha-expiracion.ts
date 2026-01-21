export class FechaExpiracion {
  private readonly fecha: Date;

  private constructor(fecha: Date) {
    this.fecha = fecha;
  }

  static crear(fecha: Date): FechaExpiracion {
    return new FechaExpiracion(fecha);
  }

  static desdeAhora(minutosExpiracion: number): FechaExpiracion {
    const fecha = new Date();
    fecha.setMinutes(fecha.getMinutes() + minutosExpiracion);
    return new FechaExpiracion(fecha);
  }

  estaExpirada(): boolean {
    return new Date() > this.fecha;
  }

  obtenerFecha(): Date {
    return this.fecha;
  }
}
