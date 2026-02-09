export class EmailVerificadoEvent {
  constructor(
    public readonly cuentaId: string,
    public readonly email: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
