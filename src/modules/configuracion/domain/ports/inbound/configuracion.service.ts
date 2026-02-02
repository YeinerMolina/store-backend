/**
 * Inbound Port: ConfiguracionService
 *
 * Defines use cases for CONFIGURACIÓN module.
 * Implementation: src/modules/configuracion/application/services/
 *
 * Security checks (permissions) belong in application layer, not here.
 */

import {
  CrearParametroOperativoProps,
  ActualizarParametroOperativoProps,
  ParametroOperativoData,
  CrearPoliticaProps,
  PublicarPoliticaProps,
  PoliticaData,
  TipoPolitica,
} from '../../aggregates/configuracion.types';

/**
 * Service interface defining all use cases for CONFIGURACIÓN module.
 */
export interface ConfiguracionService {
  crearParametroOperativo(
    params: CrearParametroOperativoProps,
  ): Promise<ParametroOperativoData>;

  /**
   * Updates parameter value.
   * Throws if parameter not found or validation fails.
   */
  actualizarParametroOperativo(
    id: string,
    params: ActualizarParametroOperativoProps,
  ): Promise<ParametroOperativoData>;

  obtenerParametroOperativo(id: string): Promise<ParametroOperativoData | null>;

  /**
   * Primary lookup for parameters (clave is the natural business identifier).
   * Example: obtenerParametroPorClave('DURACION_RESERVA_VENTA')
   */
  obtenerParametroPorClave(
    clave: string,
  ): Promise<ParametroOperativoData | null>;

  listarParametros(): Promise<ParametroOperativoData[]>;

  /**
   * Creates policy in BORRADOR state.
   * Must publish separately with publicarPolitica().
   */
  crearPolitica(params: CrearPoliticaProps): Promise<PoliticaData>;

  /**
   * Publish policy: BORRADOR → VIGENTE.
   * Automatically archives previous policies of same type.
   */
  publicarPolitica(
    politicaId: string,
    params: PublicarPoliticaProps,
  ): Promise<PoliticaData>;

  /**
   * Get currently effective (VIGENTE) policy for given type.
   * Returns null if no active policy exists.
   */
  obtenerPoliticaVigente(tipo: TipoPolitica): Promise<PoliticaData | null>;

  /**
   * List all policies (all states: BORRADOR, VIGENTE, ARCHIVADA).
   * Optional type filter.
   */
  listarPoliticas(tipo?: TipoPolitica): Promise<PoliticaData[]>;
}
