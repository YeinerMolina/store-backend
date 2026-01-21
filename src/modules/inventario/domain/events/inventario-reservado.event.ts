export class InventarioReservado {
  constructor(
    public readonly reservaId: string,
    public readonly inventarioId: string,
    public readonly cantidad: number,
    public readonly operacionId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
