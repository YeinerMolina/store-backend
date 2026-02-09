export class PasswordRecuperadoEvent {
  constructor(
    public readonly cuentaId: string,
    public readonly ip: string | null,
    public readonly timestamp: Date = new Date(),
  ) {}
}
