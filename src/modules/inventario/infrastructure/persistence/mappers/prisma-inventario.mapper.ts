import { Inventario } from '../../../domain/aggregates/inventario/inventario.entity';

export class PrismaInventarioMapper {
  static toPersistence(inventario: Inventario) {
    return {
      id: inventario.id,
      tipoItem: inventario.tipoItem,
      itemId: inventario.itemId,
      ubicacion: inventario.ubicacion || null,
      cantidadDisponible: inventario.cantidadDisponible.obtenerValor(),
      cantidadReservada: inventario.cantidadReservada.obtenerValor(),
      cantidadAbandono: inventario.cantidadAbandono.obtenerValor(),
      version: inventario.version.obtenerNumero(),
      fechaActualizacion: inventario.fechaActualizacion,
    };
  }

  static toDomain(data: any): Inventario {
    return Inventario.desde({
      id: data.id,
      tipoItem: data.tipoItem,
      itemId: data.itemId,
      ubicacion: data.ubicacion,
      cantidadDisponible: data.cantidadDisponible,
      cantidadReservada: data.cantidadReservada,
      cantidadAbandono: data.cantidadAbandono,
      version: data.version,
      fechaActualizacion: data.fechaActualizacion,
    });
  }
}
