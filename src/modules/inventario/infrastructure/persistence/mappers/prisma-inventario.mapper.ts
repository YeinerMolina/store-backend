import { Inventario } from '../../../domain/aggregates/inventario/inventario.entity';

/**
 * Mapper para transformar entidades de dominio a formato de persistencia.
 *
 * NO incluye toDomain() porque es un mapeo 1:1 que simplemente delega
 * a Inventario.desde(). Usar directamente la factory del agregado.
 */
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
}
