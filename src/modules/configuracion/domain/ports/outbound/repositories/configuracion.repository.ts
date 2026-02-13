import { ParametroOperativo } from '../../../aggregates/parametro-operativo/parametro-operativo.entity';
import { Politica } from '../../../aggregates/politica/politica.entity';
import { TipoPoliticaEnum } from '../../../aggregates/configuracion.types';

export interface ConfiguracionRepository {
  guardarParametro(parametro: ParametroOperativo): Promise<void>;

  buscarParametroPorId(id: string): Promise<ParametroOperativo | null>;

  buscarParametroPorClave(clave: string): Promise<ParametroOperativo | null>;

  listarParametros(): Promise<ParametroOperativo[]>;

  guardarPolitica(politica: Politica): Promise<void>;

  buscarPoliticaPorId(id: string): Promise<Politica | null>;

  buscarPoliticaVigente(tipo: TipoPoliticaEnum): Promise<Politica | null>;

  listarPoliticas(tipo?: TipoPoliticaEnum): Promise<Politica[]>;

  buscarPoliticasVigentesPorTipo(tipo: TipoPoliticaEnum): Promise<Politica[]>;
}
