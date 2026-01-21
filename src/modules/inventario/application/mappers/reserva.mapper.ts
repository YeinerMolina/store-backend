import { Reserva } from '../../domain/aggregates/inventario/reserva.entity';
import { ReservaResponseDto } from '../dto/reserva-response.dto';

export class ReservaMapper {
  static toResponse(reserva: Reserva): ReservaResponseDto {
    return {
      id: reserva.id,
      inventarioId: reserva.inventarioId,
      tipoOperacion: reserva.tipoOperacion,
      operacionId: reserva.operacionId,
      cantidad: reserva.cantidad,
      estado: reserva.estado,
      fechaCreacion: reserva.fechaCreacion.toISOString(),
      fechaExpiracion: reserva.fechaExpiracion.obtenerFecha().toISOString(),
      fechaResolucion: reserva.fechaResolucion?.toISOString(),
      actorTipo: reserva.actorTipo,
      actorId: reserva.actorId,
      estaExpirada: reserva.estaExpirada(),
    };
  }
}
