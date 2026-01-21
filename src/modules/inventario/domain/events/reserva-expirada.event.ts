export class ReservaExpirada {
  constructor(
    public readonly reservaId: string,
    public readonly inventarioId: string,
    public readonly cantidadLiberada: number,
    public readonly timestamp: Date = new Date(),
  ) {}
}
