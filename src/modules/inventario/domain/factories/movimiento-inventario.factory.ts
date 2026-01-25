import { IdGenerator } from '@shared/domain/factories';
import { MovimientoInventario } from '../aggregates/inventario/movimiento-inventario.entity';
import type { CrearMovimientoInventarioProps } from '../aggregates/inventario/movimiento-inventario.types';

export class MovimientoInventarioFactory {
  static crear(props: CrearMovimientoInventarioProps): MovimientoInventario {
    const id = IdGenerator.generate();

    return MovimientoInventario.desde({
      id,
      inventarioId: props.inventarioId,
      tipoMovimiento: props.tipoMovimiento,
      cantidad: props.cantidad,
      cantidadAnterior: props.cantidadAnterior,
      cantidadPosterior: props.cantidadPosterior,
      tipoOperacionOrigen: props.tipoOperacionOrigen,
      operacionOrigenId: props.operacionOrigenId,
      empleadoId: props.empleadoId,
      intencion: props.intencion,
      notas: props.notas,
      fechaMovimiento: new Date(),
    });
  }
}
