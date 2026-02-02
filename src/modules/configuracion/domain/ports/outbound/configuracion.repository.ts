/**
 * Outbound Port: ConfiguracionRepository
 *
 * Abstracts persistence for CONFIGURACIÓN aggregates.
 * Implementation: src/modules/configuracion/infrastructure/persistence/
 *
 * All methods work with domain entities, not DTOs (transformation happens in mappers).
 * Implementation uses Prisma, but interface is ORM-agnostic.
 */

import { ParametroOperativo } from '../../aggregates/parametro-operativo/parametro-operativo.entity';
import { Politica } from '../../aggregates/politica/politica.entity';
import { TipoPolitica } from '../../aggregates/configuracion.types';

/**
 * Repository interface for CONFIGURACIÓN aggregates.
 */
export interface ConfiguracionRepository {
  /**
   * Save parameter (UPSERT: insert if not exists, update if exists).
   * Throws if database is unavailable.
   */
  guardarParametro(parametro: ParametroOperativo): Promise<void>;

  buscarParametroPorId(id: string): Promise<ParametroOperativo | null>;

  /**
   * Primary parameter lookup by natural business identifier (clave).
   * Example: buscarParametroPorClave('DURACION_RESERVA_VENTA')
   */
  buscarParametroPorClave(clave: string): Promise<ParametroOperativo | null>;

  listarParametros(): Promise<ParametroOperativo[]>;

  /**
   * Save policy (UPSERT).
   * Throws if database unavailable or invariant violated.
   */
  guardarPolitica(politica: Politica): Promise<void>;

  buscarPoliticaPorId(id: string): Promise<Politica | null>;

  /**
   * Get currently active (VIGENTE) policy for given type.
   * Guarantees: returns max 1 VIGENTE policy (critical invariant).
   */
  buscarPoliticaVigente(tipo: TipoPolitica): Promise<Politica | null>;

  /**
   * List all policies (all states: BORRADOR, VIGENTE, ARCHIVADA).
   * Optional type filter.
   */
  listarPoliticas(tipo?: TipoPolitica): Promise<Politica[]>;

  /**
   * Find all VIGENTE policies of given type.
   * Returns 0 or 1 normally; queries as array for invariant checks.
   */
  buscarPoliticasVigentesPorTipo(tipo: TipoPolitica): Promise<Politica[]>;
}
