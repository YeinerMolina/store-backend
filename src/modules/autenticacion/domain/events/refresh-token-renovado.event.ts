export class RefreshTokenRenovadoEvent {
  constructor(
    public readonly cuentaId: string,
    public readonly sesionId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
