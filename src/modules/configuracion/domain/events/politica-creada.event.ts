import { TipoPoliticaEnum } from '../aggregates/configuracion.types';
import { ConfiguracionEventType } from './configuracion-event-type.enum';

/**
 * Política creada en estado BORRADOR (aún no vigente).
 */
export class PoliticaCreada {
  readonly eventType = ConfiguracionEventType.POLITICA_CREADA;

  constructor(
    readonly agregadoId: string,
    readonly tipo: TipoPoliticaEnum,
    readonly version: string,
    readonly occurredAt: Date = new Date(),
  ) {}
}
