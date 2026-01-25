import { IdGenerator } from '@shared/domain/factories';
import { Reserva } from '../aggregates/inventario/reserva.entity';
import { FechaExpiracion } from '../value-objects/fecha-expiracion';
import { EstadoReservaEnum } from '../aggregates/inventario/types';
import type { CrearReservaProps } from '../aggregates/inventario/reserva.types';

export class ReservaFactory {
  static crear(props: CrearReservaProps): Reserva {
    const id = IdGenerator.generate();
    const fechaCreacion = new Date();
    const fechaExpiracion = FechaExpiracion.desdeAhora(
      props.minutosExpiracion,
    ).obtenerFecha();

    return Reserva.desde({
      id,
      inventarioId: props.inventarioId,
      tipoOperacion: props.tipoOperacion,
      operacionId: props.operacionId,
      cantidad: props.cantidad,
      estado: EstadoReservaEnum.ACTIVA,
      fechaCreacion,
      fechaExpiracion,
      fechaResolucion: undefined,
      actorTipo: props.actorTipo,
      actorId: props.actorId,
    });
  }
}
