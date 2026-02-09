export class CuentaDesbloqueadaEvent {
  constructor(
    public readonly cuentaId: string,
    public readonly adminId: string | null,
    public readonly timestamp: Date = new Date(),
  ) {}
}
