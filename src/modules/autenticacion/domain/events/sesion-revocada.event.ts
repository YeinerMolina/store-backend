export class SesionRevocadaEvent {
  constructor(
    public readonly sesionId: string,
    public readonly motivo: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
