export class PasswordCambiadoEvent {
  constructor(
    public readonly cuentaId: string,
    public readonly tipoCambio: 'MANUAL' | 'RECUPERACION',
    public readonly timestamp: Date = new Date(),
  ) {}
}
