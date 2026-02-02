/**
 * Domain Events - CONFIGURACIÓN Module
 *
 * Events emitted by aggregates during state transitions.
 * Used for auditability (EventoDominio table) and cross-module communication.
 */

import { TipoPolitica } from '../aggregates/configuracion.types';

/**
 * Emitted when ParametroOperativo is created.
 * Contains clave (unique identifier) and initial value.
 */
export class ParametroOperativoCreado {
  readonly eventType = 'ParametroOperativoCreado';

  constructor(
    readonly agregadoId: string,
    readonly clave: string,
    readonly valor: string,
    readonly occurredAt: Date = new Date(),
  ) {}
}

/**
 * Emitted when ParametroOperativo value changes.
 * requiereReinicio flag notifies if app restart is needed.
 */
export class ParametroOperativoActualizado {
  readonly eventType = 'ParametroOperativoActualizado';

  constructor(
    readonly agregadoId: string,
    readonly clave: string,
    readonly valorAnterior: string,
    readonly valorNuevo: string,
    readonly requiereReinicio: boolean,
    readonly occurredAt: Date = new Date(),
  ) {}
}

/**
 * Emitted when Politica is created (BORRADOR state).
 * Not yet effective; needs publishing first.
 */
export class PoliticaCreada {
  readonly eventType = 'PoliticaCreada';

  constructor(
    readonly agregadoId: string,
    readonly tipo: TipoPolitica,
    readonly version: string,
    readonly occurredAt: Date = new Date(),
  ) {}
}

/**
 * Emitted when Politica transitions BORRADOR → VIGENTE.
 * fechaVigenciaDesde marks when policy becomes effective.
 */
export class PoliticaPublicada {
  readonly eventType = 'PoliticaPublicada';

  constructor(
    readonly agregadoId: string,
    readonly tipo: TipoPolitica,
    readonly version: string,
    readonly fechaVigenciaDesde: Date,
    readonly occurredAt: Date = new Date(),
  ) {}
}

/**
 * Emitted when Politica transitions → ARCHIVADA.
 * Marks end of policy's validity period.
 */
export class PoliticaArchivada {
  readonly eventType = 'PoliticaArchivada';

  constructor(
    readonly agregadoId: string,
    readonly tipo: TipoPolitica,
    readonly version: string,
    readonly occurredAt: Date = new Date(),
  ) {}
}
