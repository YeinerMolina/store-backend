export class InventarioDescontado {
  constructor(
    public readonly inventarioId: string,
    public readonly cantidad: number,
    public readonly operacionId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
