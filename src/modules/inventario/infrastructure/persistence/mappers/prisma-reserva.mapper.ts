import type { Reserva as PrismaReserva } from '@prisma/client';
import { Reserva } from '../../../domain/aggregates/inventario/reserva.entity';
import {
  EstadoReservaEnum,
  TipoOperacionEnum,
  TipoActorEnum,
} from '../../../domain/aggregates/inventario/types';

export class PrismaReservaMapper {
  /**
   * Maps Prisma Reserva record to domain Reserva aggregate.
   * Handles all fields including nullable resolution dates and actor information.
   */
  static toDomain(data: PrismaReserva): Reserva {
    return Reserva.desde({
      id: data.id,
      inventarioId: data.inventarioId,
      tipoOperacion: data.tipoOperacion as TipoOperacionEnum,
      operacionId: data.operacionId,
      cantidad: data.cantidad,
      estado: data.estado as EstadoReservaEnum,
      fechaCreacion: data.fechaCreacion,
      fechaExpiracion: data.fechaExpiracion,
      fechaResolucion: data.fechaResolucion ?? undefined,
      actorTipo: data.actorTipo as TipoActorEnum,
      actorId: data.actorId,
    });
  }
}
