export { ParametroOperativo } from './aggregates/parametro-operativo/parametro-operativo.entity';
export { Politica } from './aggregates/politica/politica.entity';

export type {
  CrearParametroOperativoProps,
  ActualizarParametroOperativoProps,
  ParametroOperativoEvento,
  CrearPoliticaProps,
  PublicarPoliticaProps,
  PoliticaEvento,
} from './aggregates/configuracion.types';

export {
  TipoDatoEnum,
  TipoPoliticaEnum,
  EstadoPoliticaEnum,
} from './aggregates/configuracion.types';

export { parseParametroValor } from './helpers/parametro.helpers';

export type { ConfiguracionService } from './ports/inbound/configuracion.service';
export type { ConfiguracionRepository } from './ports/outbound/configuracion.repository';

export {
  ConfiguracionEventType,
  ParametroOperativoCreado,
  ParametroOperativoActualizado,
  PoliticaCreada,
  PoliticaPublicada,
  PoliticaArchivada,
} from './events';

export { ParametroOperativoFactory, PoliticaFactory } from './factories';

export {
  CONFIGURACION_SERVICE_TOKEN,
  CONFIGURACION_REPOSITORY_TOKEN,
} from './ports/tokens';
