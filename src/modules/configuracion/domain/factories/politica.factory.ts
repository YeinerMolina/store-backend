import { IdGenerator } from '@shared/domain/factories';
import { Politica } from '../aggregates/politica/politica.entity';
import type { CrearPoliticaProps } from '../aggregates/configuracion.types';

/**
 * Factory externalizes UUID v7 generation to maintain aggregate purity.
 * ID generation is infrastructure concern, not domain logic.
 */
export class PoliticaFactory {
  static crear(props: CrearPoliticaProps): Politica {
    const id = IdGenerator.generate();
    return Politica.crear(id, props);
  }
}
