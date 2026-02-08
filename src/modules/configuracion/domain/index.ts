// Agregados
export { ParametroOperativo } from './aggregates/parametro-operativo/parametro-operativo.entity';
export { Politica } from './aggregates/politica/politica.entity';

// Types
export type {
  CrearParametroOperativoProps,
  ActualizarParametroOperativoProps,
  ParametroOperativoData,
  ParametroOperativoEvento,
  CrearPoliticaProps,
  PublicarPoliticaProps,
  PoliticaData,
  PoliticaEvento,
} from './aggregates/configuracion.types';

// Enums
export {
  TipoDatoEnum,
  TipoPoliticaEnum,
  EstadoPoliticaEnum,
} from './aggregates/configuracion.types';

// Helpers
export { parseParametroValor } from './helpers/parametro.helpers';

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
