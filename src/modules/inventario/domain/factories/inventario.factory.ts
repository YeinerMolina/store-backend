import { IdGenerator } from '@shared/domain/factories';
import { Inventario } from '../aggregates/inventario/inventario.entity';
import type { CrearInventarioProps } from '../aggregates/inventario/inventario.types';

export class InventarioFactory {
  static crear(props: CrearInventarioProps): Inventario {
    const id = IdGenerator.generate();
    return Inventario.crear(id, props);
  }
}
