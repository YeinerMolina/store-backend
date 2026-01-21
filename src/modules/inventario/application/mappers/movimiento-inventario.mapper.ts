import { MovimientoInventario } from '../../domain/aggregates/inventario/movimiento-inventario.entity';

export class MovimientoInventarioMapper {
  static toResponse(movimiento: MovimientoInventario) {
    return {
      id: movimiento.id,
      inventarioId: movimiento.inventarioId,
      tipoMovimiento: movimiento.tipoMovimiento,
      cantidad: movimiento.cantidad,
      cantidadAnterior: movimiento.cantidadAnterior,
      cantidadPosterior: movimiento.cantidadPosterior,
      tipoOperacionOrigen: movimiento.tipoOperacionOrigen,
      operacionOrigenId: movimiento.operacionOrigenId,
      empleadoId: movimiento.empleadoId,
      intencion: movimiento.intencion,
      notas: movimiento.notas,
      fechaMovimiento: movimiento.fechaMovimiento.toISOString(),
    };
  }
}
