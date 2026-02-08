import { TipoPoliticaEnum } from '../aggregates/configuracion.types';
import { ConfiguracionEventType } from './configuracion-event-type.enum';

export class PoliticaArchivada {
  readonly eventType = ConfiguracionEventType.POLITICA_ARCHIVADA;

  constructor(
    readonly agregadoId: string,
    readonly tipo: TipoPoliticaEnum,
    readonly version: string,
    readonly occurredAt: Date = new Date(),
  ) {}
}
