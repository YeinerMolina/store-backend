import type { InventarioResponseDto } from '../dto/inventario-response.dto';
import type { ReservaResponseDto } from '../dto/reserva-response.dto';
import type { Inventario } from '../../domain/aggregates/inventario/inventario.entity';
import type { Reserva } from '../../domain/aggregates/inventario/reserva.entity';

export class InventarioResponseMapper {
  static toInventarioDto(inventario: Inventario): InventarioResponseDto {
    return {
      id: inventario.id,
      tipoItem: inventario.tipoItem,
      itemId: inventario.itemId,
      cantidadDisponible: inventario.cantidadDisponible.obtenerValor(),
      cantidadReservada: inventario.cantidadReservada.obtenerValor(),
      cantidadAbandono: inventario.cantidadAbandono.obtenerValor(),
      ubicacion: inventario.ubicacion,
      version: inventario.version.obtenerNumero(),
      fechaActualizacion: inventario.fechaActualizacion.toISOString(),
    };
  }

  static toReservaDto(reserva: Reserva): ReservaResponseDto {
    return {
      id: reserva.id,
      inventarioId: reserva.inventarioId,
      cantidad: reserva.cantidad,
      estado: reserva.estado,
      fechaCreacion: reserva.fechaCreacion.toISOString(),
      fechaExpiracion: reserva.fechaExpiracion.obtenerFecha().toISOString(),
      fechaResolucion: reserva.fechaResolucion?.toISOString(),
      tipoOperacion: reserva.tipoOperacion,
      operacionId: reserva.operacionId,
      actorTipo: reserva.actorTipo,
      actorId: reserva.actorId,
      estaExpirada: reserva.estaExpirada(),
    };
  }
}
