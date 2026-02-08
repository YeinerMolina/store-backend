import { IdGenerator } from '@shared/domain/factories';
import { ParametroOperativo } from '../aggregates/parametro-operativo/parametro-operativo.entity';
import type { CrearParametroOperativoProps } from '../aggregates/configuracion.types';

/**
 * Factory externalizes UUID v7 generation to maintain aggregate purity.
 * ID generation is infrastructure concern, not domain logic.
 */
export class ParametroOperativoFactory {
  static crear(props: CrearParametroOperativoProps): ParametroOperativo {
    const id = IdGenerator.generate();
    return ParametroOperativo.crear(id, props);
  }
}
