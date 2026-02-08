import { ConfiguracionEventType } from './configuracion-event-type.enum';

export class ParametroOperativoCreado {
  readonly eventType = ConfiguracionEventType.PARAMETRO_OPERATIVO_CREADO;

  constructor(
    readonly agregadoId: string,
    readonly clave: string,
    readonly valor: string,
    readonly occurredAt: Date = new Date(),
  ) {}
}
