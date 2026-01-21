import { TipoMovimientoEnum, TipoOperacionEnum } from './types';

export class MovimientoInventario {
  id: string;
  inventarioId: string;
  tipoMovimiento: TipoMovimientoEnum;
  cantidad: number;
  cantidadAnterior: number;
  cantidadPosterior: number;
  tipoOperacionOrigen?: TipoOperacionEnum;
  operacionOrigenId?: string;
  empleadoId?: string;
  intencion?: string;
  notas?: string;
  fechaMovimiento: Date;

  private constructor() {}

  static crear(props: {
    inventarioId: string;
    tipoMovimiento: TipoMovimientoEnum;
    cantidad: number;
    cantidadAnterior: number;
    cantidadPosterior: number;
    tipoOperacionOrigen?: TipoOperacionEnum;
    operacionOrigenId?: string;
    empleadoId?: string;
    intencion?: string;
    notas?: string;
  }): MovimientoInventario {
    const movimiento = new MovimientoInventario();
    movimiento.id = crypto.randomUUID();
    movimiento.inventarioId = props.inventarioId;
    movimiento.tipoMovimiento = props.tipoMovimiento;
    movimiento.cantidad = props.cantidad;
    movimiento.cantidadAnterior = props.cantidadAnterior;
    movimiento.cantidadPosterior = props.cantidadPosterior;
    movimiento.tipoOperacionOrigen = props.tipoOperacionOrigen;
    movimiento.operacionOrigenId = props.operacionOrigenId;
    movimiento.empleadoId = props.empleadoId;
    movimiento.intencion = props.intencion;
    movimiento.notas = props.notas;
    movimiento.fechaMovimiento = new Date();

    return movimiento;
  }

  static desde(data: any): MovimientoInventario {
    const movimiento = new MovimientoInventario();
    movimiento.id = data.id;
    movimiento.inventarioId = data.inventarioId;
    movimiento.tipoMovimiento = data.tipoMovimiento;
    movimiento.cantidad = data.cantidad;
    movimiento.cantidadAnterior = data.cantidadAnterior;
    movimiento.cantidadPosterior = data.cantidadPosterior;
    movimiento.tipoOperacionOrigen = data.tipoOperacionOrigen;
    movimiento.operacionOrigenId = data.operacionOrigenId;
    movimiento.empleadoId = data.empleadoId;
    movimiento.intencion = data.intencion;
    movimiento.notas = data.notas;
    movimiento.fechaMovimiento = data.fechaMovimiento;

    return movimiento;
  }
}
