import { ConfiguracionEventType } from './configuracion-event-type.enum';

/**
 * Flag requiereReinicio indica si se necesita reiniciar la app.
 */
export class ParametroOperativoActualizado {
  readonly eventType = ConfiguracionEventType.PARAMETRO_OPERATIVO_ACTUALIZADO;

  constructor(
    readonly agregadoId: string,
    readonly clave: string,
    readonly valorAnterior: string,
    readonly valorNuevo: string,
    readonly requiereReinicio: boolean,
    readonly occurredAt: Date = new Date(),
  ) {}
}
