import { ParametroOperativo } from '../../aggregates/parametro-operativo/parametro-operativo.entity';
import { Politica } from '../../aggregates/politica/politica.entity';
import { TipoPolitica } from '../../aggregates/configuracion.types';

export interface ConfiguracionRepository {
  /**
   * UPSERT: insert si no existe, update si existe.
   */
  guardarParametro(parametro: ParametroOperativo): Promise<void>;

  buscarParametroPorId(id: string): Promise<ParametroOperativo | null>;

  /**
   * Búsqueda principal por identificador de negocio (clave).
   */
  buscarParametroPorClave(clave: string): Promise<ParametroOperativo | null>;

  listarParametros(): Promise<ParametroOperativo[]>;

  guardarPolitica(politica: Politica): Promise<void>;

  buscarPoliticaPorId(id: string): Promise<Politica | null>;

  /**
   * Garantiza max 1 política VIGENTE por tipo (invariante crítico).
   */
  buscarPoliticaVigente(tipo: TipoPolitica): Promise<Politica | null>;

  listarPoliticas(tipo?: TipoPolitica): Promise<Politica[]>;

  /**
   * Retorna 0 o 1 normalmente; array para checks de invariante.
   */
  buscarPoliticasVigentesPorTipo(tipo: TipoPolitica): Promise<Politica[]>;
}
