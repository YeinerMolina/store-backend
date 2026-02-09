export class LoginExitosoEvent {
  constructor(
    public readonly cuentaId: string,
    public readonly tipoUsuario: string,
    public readonly ip: string | null,
    public readonly dispositivo: string | null,
    public readonly timestamp: Date = new Date(),
  ) {}
}
