import { IdGenerator } from '@shared/domain/factories';
import { Inventario } from '../aggregates/inventario/inventario.entity';
import type { CrearInventarioProps } from '../aggregates/inventario/inventario.types';

export class InventarioFactory {
  static crear(props: CrearInventarioProps): Inventario {
    const id = IdGenerator.generate();

    return Inventario.desde({
      id,
      tipoItem: props.tipoItem,
      itemId: props.itemId,
      ubicacion: props.ubicacion,
      cantidadDisponible: 0,
      cantidadReservada: 0,
      cantidadAbandono: 0,
      version: 1,
      fechaActualizacion: new Date(),
    });
  }
}
