import { EstadoReservaEnum, TipoActorEnum, TipoOperacionEnum } from './types';
import { FechaExpiracion } from '../../value-objects/fecha-expiracion';
import { EstadoInvalidoError } from '../../exceptions';

export class Reserva {
  id: string;
  inventarioId: string;
  tipoOperacion: TipoOperacionEnum;
  operacionId: string;
  cantidad: number;
  estado: EstadoReservaEnum;
  fechaCreacion: Date;
  fechaExpiracion: FechaExpiracion;
  fechaResolucion?: Date;
  actorTipo: TipoActorEnum;
  actorId: string;

  private constructor() {}

  static crear(props: {
    inventarioId: string;
    tipoOperacion: TipoOperacionEnum;
    operacionId: string;
    cantidad: number;
    actorTipo: TipoActorEnum;
    actorId: string;
    minutosExpiracion: number;
  }): Reserva {
    const reserva = new Reserva();
    reserva.id = crypto.randomUUID();
    reserva.inventarioId = props.inventarioId;
    reserva.tipoOperacion = props.tipoOperacion;
    reserva.operacionId = props.operacionId;
    reserva.cantidad = props.cantidad;
    reserva.estado = EstadoReservaEnum.ACTIVA;
    reserva.fechaCreacion = new Date();
    reserva.fechaExpiracion = FechaExpiracion.desdeAhora(
      props.minutosExpiracion,
    );
    reserva.actorTipo = props.actorTipo;
    reserva.actorId = props.actorId;

    return reserva;
  }

  static desde(data: any): Reserva {
    const reserva = new Reserva();
    reserva.id = data.id;
    reserva.inventarioId = data.inventarioId;
    reserva.tipoOperacion = data.tipoOperacion;
    reserva.operacionId = data.operacionId;
    reserva.cantidad = data.cantidad;
    reserva.estado = data.estado;
    reserva.fechaCreacion = data.fechaCreacion;
    reserva.fechaExpiracion = FechaExpiracion.crear(data.fechaExpiracion);
    reserva.fechaResolucion = data.fechaResolucion;
    reserva.actorTipo = data.actorTipo;
    reserva.actorId = data.actorId;

    return reserva;
  }

  estaExpirada(): boolean {
    return this.fechaExpiracion.estaExpirada();
  }

  consolidar(): void {
    if (this.estado !== EstadoReservaEnum.ACTIVA) {
      throw new EstadoInvalidoError(
        'Solo se pueden consolidar reservas activas',
      );
    }
    this.estado = EstadoReservaEnum.CONSOLIDADA;
    this.fechaResolucion = new Date();
  }

  liberar(): void {
    if (this.estado !== EstadoReservaEnum.ACTIVA) {
      throw new EstadoInvalidoError('Solo se pueden liberar reservas activas');
    }
    this.estado = EstadoReservaEnum.LIBERADA;
    this.fechaResolucion = new Date();
  }

  expirar(): void {
    if (this.estado !== EstadoReservaEnum.ACTIVA) {
      throw new EstadoInvalidoError('Solo se pueden expirar reservas activas');
    }
    this.estado = EstadoReservaEnum.EXPIRADA;
    this.fechaResolucion = new Date();
  }
}
