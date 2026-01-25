import { EstadoReservaEnum, TipoActorEnum, TipoOperacionEnum } from './types';

/**
 * Props para crear una nueva Reserva
 */
export interface CrearReservaProps {
  readonly inventarioId: string;
  readonly tipoOperacion: TipoOperacionEnum;
  readonly operacionId: string;
  readonly cantidad: number;
  readonly actorTipo: TipoActorEnum;
  readonly actorId: string;
  readonly minutosExpiracion: number;
}

/**
 * Datos de persistencia para reconstruir Reserva
 */
export interface ReservaData {
  readonly id: string;
  readonly inventarioId: string;
  readonly tipoOperacion: TipoOperacionEnum;
  readonly operacionId: string;
  readonly cantidad: number;
  readonly estado: EstadoReservaEnum;
  readonly fechaCreacion: Date;
  readonly fechaExpiracion: Date;
  readonly fechaResolucion?: Date;
  readonly actorTipo: TipoActorEnum;
  readonly actorId: string;
}
