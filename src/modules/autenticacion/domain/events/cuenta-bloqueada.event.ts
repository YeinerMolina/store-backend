export class CuentaBloqueadaEvent {
  constructor(
    public readonly cuentaId: string,
    public readonly bloqueadoHasta: Date,
    public readonly timestamp: Date = new Date(),
  ) {}
}
