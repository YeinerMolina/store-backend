import { Inventario } from '../../domain/aggregates/inventario/inventario.entity';
import { InventarioResponseDto } from '../dto/inventario-response.dto';

export class InventarioMapper {
  static toResponse(inventario: Inventario): InventarioResponseDto {
    return {
      id: inventario.id,
      tipoItem: inventario.tipoItem,
      itemId: inventario.itemId,
      ubicacion: inventario.ubicacion,
      cantidadDisponible: inventario.cantidadDisponible.obtenerValor(),
      cantidadReservada: inventario.cantidadReservada.obtenerValor(),
      cantidadAbandono: inventario.cantidadAbandono.obtenerValor(),
      version: inventario.version.obtenerNumero(),
      fechaActualizacion: inventario.fechaActualizacion.toISOString(),
    };
  }
}
