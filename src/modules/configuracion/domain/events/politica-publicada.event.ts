import { TipoPoliticaEnum } from '../aggregates/configuracion.types';
import { ConfiguracionEventType } from './configuracion-event-type.enum';

export class PoliticaPublicada {
  readonly eventType = ConfiguracionEventType.POLITICA_PUBLICADA;

  constructor(
    readonly agregadoId: string,
    readonly tipo: TipoPoliticaEnum,
    readonly version: string,
    readonly fechaVigenciaDesde: Date,
    readonly occurredAt: Date = new Date(),
  ) {}
}
