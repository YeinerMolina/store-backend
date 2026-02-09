export class LoginFallidoEvent {
  constructor(
    public readonly emailIntento: string,
    public readonly ip: string,
    public readonly motivo: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
