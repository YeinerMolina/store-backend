export class StockBajoDetectado {
  constructor(
    public readonly inventarioId: string,
    public readonly cantidadActual: number,
    public readonly umbral: number,
    public readonly timestamp: Date = new Date(),
  ) {}
}
