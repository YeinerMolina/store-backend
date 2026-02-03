import {
  CrearParametroOperativoProps,
  ActualizarParametroOperativoProps,
  ParametroOperativoData,
  CrearPoliticaProps,
  PublicarPoliticaProps,
  PoliticaData,
  TipoPolitica,
} from '../../aggregates/configuracion.types';

export interface ConfiguracionService {
  crearParametroOperativo(
    params: CrearParametroOperativoProps,
  ): Promise<ParametroOperativoData>;

  actualizarParametroOperativo(
    id: string,
    params: ActualizarParametroOperativoProps,
  ): Promise<ParametroOperativoData>;

  obtenerParametroOperativo(id: string): Promise<ParametroOperativoData | null>;

  /**
   * Búsqueda principal por clave (identificador de negocio).
   */
  obtenerParametroPorClave(
    clave: string,
  ): Promise<ParametroOperativoData | null>;

  listarParametros(): Promise<ParametroOperativoData[]>;

  /**
   * Crea política en estado BORRADOR (publicar después).
   */
  crearPolitica(params: CrearPoliticaProps): Promise<PoliticaData>;

  /**
   * Archiva automáticamente políticas anteriores del mismo tipo.
   */
  publicarPolitica(
    politicaId: string,
    params: PublicarPoliticaProps,
  ): Promise<PoliticaData>;

  obtenerPoliticaVigente(tipo: TipoPolitica): Promise<PoliticaData | null>;
  listarPoliticas(tipo?: TipoPolitica): Promise<PoliticaData[]>;
}
