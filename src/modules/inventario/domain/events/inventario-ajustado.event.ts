export class InventarioAjustado {
  constructor(
    public readonly inventarioId: string,
    public readonly cantidadAnterior: number,
    public readonly cantidadPosterior: number,
    public readonly empleadoId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
