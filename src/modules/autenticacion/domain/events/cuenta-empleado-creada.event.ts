export class CuentaEmpleadoCreadaEvent {
  constructor(
    public readonly cuentaId: string,
    public readonly empleadoId: string,
    public readonly email: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
