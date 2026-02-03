// Agregados
export { ParametroOperativo } from './aggregates/parametro-operativo/parametro-operativo.entity';
export { Politica } from './aggregates/politica/politica.entity';

// Types
export type {
  TipoDato,
  TipoPolitica,
  EstadoPolitica,
  CrearParametroOperativoProps,
  ActualizarParametroOperativoProps,
  ParametroOperativoData,
  CrearPoliticaProps,
  PublicarPoliticaProps,
  PoliticaData,
} from './aggregates/configuracion.types';

export {
  TipoDatoEnum,
  TipoPoliticaEnum,
  EstadoPoliticaEnum,
} from './aggregates/configuracion.types';

// Type guards
export {
  isTipoDato,
  isTipoPolitica,
  isEstadoPolitica,
} from './aggregates/configuracion.types';

// Puertos
export type { ConfiguracionService } from './ports/inbound/configuracion.service';
export type { ConfiguracionRepository } from './ports/outbound/configuracion.repository';

// Eventos
export {
  ParametroOperativoCreado,
  ParametroOperativoActualizado,
  PoliticaCreada,
  PoliticaPublicada,
  PoliticaArchivada,
} from './events/configuracion.events';
