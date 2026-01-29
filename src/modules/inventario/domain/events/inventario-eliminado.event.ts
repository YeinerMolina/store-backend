export class InventarioEliminado {
  constructor(
    public readonly inventarioId: string,
    public readonly tipoItem: string,
    public readonly itemId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
