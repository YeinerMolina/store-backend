export class CuentaClienteCreadaEvent {
  constructor(
    public readonly cuentaId: string,
    public readonly clienteId: string,
    public readonly email: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
