import { TipoPolitica } from '../aggregates/configuracion.types';

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
 * Flag requiereReinicio indica si se necesita reiniciar la app.
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
 * Política creada en estado BORRADOR (aún no vigente).
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

export class PoliticaArchivada {
  readonly eventType = 'PoliticaArchivada';

  constructor(
    readonly agregadoId: string,
    readonly tipo: TipoPolitica,
    readonly version: string,
    readonly occurredAt: Date = new Date(),
  ) {}
}
