import { Cantidad } from '../../value-objects/cantidad';
import { Version } from '../../value-objects/version';
import {
  EstadoReservaEnum,
  TipoActorEnum,
  TipoItemEnum,
  TipoMovimientoEnum,
  TipoOperacionEnum,
} from './types';
import { Reserva } from './reserva.entity';
import { MovimientoInventario } from './movimiento-inventario.entity';
import { InventarioReservado } from '../../events/inventario-reservado.event';
import { InventarioDescontado } from '../../events/inventario-descontado.event';
import { InventarioAjustado } from '../../events/inventario-ajustado.event';
import {
  StockInsuficienteError,
  EstadoInvalidoError,
} from '../../../../../shared/exceptions/domain.exception';

export class Inventario {
  id: string;
  tipoItem: TipoItemEnum;
  itemId: string;
  ubicacion?: string;
  cantidadDisponible: Cantidad;
  cantidadReservada: Cantidad;
  cantidadAbandono: Cantidad;
  version: Version;
  fechaActualizacion: Date;

  private domainEvents: any[] = [];

  private constructor() {}

  static crear(props: {
    tipoItem: TipoItemEnum;
    itemId: string;
    ubicacion?: string;
  }): Inventario {
    const inventario = new Inventario();
    inventario.id = crypto.randomUUID();
    inventario.tipoItem = props.tipoItem;
    inventario.itemId = props.itemId;
    inventario.ubicacion = props.ubicacion;
    inventario.cantidadDisponible = Cantidad.zero();
    inventario.cantidadReservada = Cantidad.zero();
    inventario.cantidadAbandono = Cantidad.zero();
    inventario.version = Version.inicial();
    inventario.fechaActualizacion = new Date();

    return inventario;
  }

  static desde(data: any): Inventario {
    const inventario = new Inventario();
    inventario.id = data.id;
    inventario.tipoItem = data.tipoItem;
    inventario.itemId = data.itemId;
    inventario.ubicacion = data.ubicacion;
    inventario.cantidadDisponible = Cantidad.crear(data.cantidadDisponible);
    inventario.cantidadReservada = Cantidad.crear(data.cantidadReservada);
    inventario.cantidadAbandono = Cantidad.crear(data.cantidadAbandono);
    inventario.version = Version.crear(data.version);
    inventario.fechaActualizacion = data.fechaActualizacion;

    return inventario;
  }

  reservar(props: {
    cantidad: number;
    operacionId: string;
    tipoOperacion: TipoOperacionEnum;
    actorTipo: TipoActorEnum;
    actorId: string;
    minutosExpiracion: number;
  }): Reserva {
    const cantidadSolicitada = Cantidad.crear(props.cantidad);

    if (!this.cantidadDisponible.esMayorOIgualA(cantidadSolicitada)) {
      throw new StockInsuficienteError(
        this.cantidadDisponible.obtenerValor(),
        props.cantidad,
      );
    }

    this.cantidadDisponible =
      this.cantidadDisponible.restar(cantidadSolicitada);
    this.cantidadReservada = this.cantidadReservada.sumar(cantidadSolicitada);
    this.version = this.version.incrementar();
    this.fechaActualizacion = new Date();

    const reserva = Reserva.crear({
      inventarioId: this.id,
      tipoOperacion: props.tipoOperacion,
      operacionId: props.operacionId,
      cantidad: props.cantidad,
      actorTipo: props.actorTipo,
      actorId: props.actorId,
      minutosExpiracion: props.minutosExpiracion,
    });

    this.addDomainEvent(
      new InventarioReservado(
        reserva.id,
        this.id,
        props.cantidad,
        props.operacionId,
      ),
    );

    return reserva;
  }

  consolidarReserva(reserva: Reserva): MovimientoInventario {
    if (reserva.estado !== EstadoReservaEnum.ACTIVA) {
      throw new EstadoInvalidoError(
        'Solo se pueden consolidar reservas activas',
      );
    }

    const cantidadReservada = Cantidad.crear(reserva.cantidad);
    const cantidadAnterior = this.cantidadReservada.obtenerValor();

    this.cantidadReservada = this.cantidadReservada.restar(cantidadReservada);
    this.version = this.version.incrementar();
    this.fechaActualizacion = new Date();

    const movimiento = MovimientoInventario.crear({
      inventarioId: this.id,
      tipoMovimiento: TipoMovimientoEnum.VENTA_SALIDA,
      cantidad: reserva.cantidad,
      cantidadAnterior,
      cantidadPosterior: this.cantidadReservada.obtenerValor(),
      tipoOperacionOrigen: reserva.tipoOperacion,
      operacionOrigenId: reserva.operacionId,
    });

    this.addDomainEvent(
      new InventarioDescontado(this.id, reserva.cantidad, reserva.operacionId),
    );

    return movimiento;
  }

  liberarReserva(reserva: Reserva): MovimientoInventario {
    if (reserva.estado !== EstadoReservaEnum.ACTIVA) {
      throw new EstadoInvalidoError('Solo se pueden liberar reservas activas');
    }

    const cantidadReservada = Cantidad.crear(reserva.cantidad);
    const cantidadAnterior = this.cantidadReservada.obtenerValor();

    this.cantidadDisponible = this.cantidadDisponible.sumar(cantidadReservada);
    this.cantidadReservada = this.cantidadReservada.restar(cantidadReservada);
    this.version = this.version.incrementar();
    this.fechaActualizacion = new Date();

    const movimiento = MovimientoInventario.crear({
      inventarioId: this.id,
      tipoMovimiento: TipoMovimientoEnum.LIBERACION,
      cantidad: reserva.cantidad,
      cantidadAnterior,
      cantidadPosterior: this.cantidadReservada.obtenerValor(),
      tipoOperacionOrigen: reserva.tipoOperacion,
      operacionOrigenId: reserva.operacionId,
    });

    return movimiento;
  }

  ajustar(props: {
    cantidad: number;
    empleadoId: string;
    intencion?: string;
    notas?: string;
  }): MovimientoInventario {
    const cantidadAjuste = Cantidad.crear(Math.abs(props.cantidad));
    const cantidadAnterior = this.cantidadDisponible.obtenerValor();

    if (props.cantidad > 0) {
      this.cantidadDisponible = this.cantidadDisponible.sumar(cantidadAjuste);
    } else {
      if (!this.cantidadDisponible.esMayorOIgualA(cantidadAjuste)) {
        throw new StockInsuficienteError(
          cantidadAnterior,
          Math.abs(props.cantidad),
        );
      }
      this.cantidadDisponible = this.cantidadDisponible.restar(cantidadAjuste);
    }

    this.version = this.version.incrementar();
    this.fechaActualizacion = new Date();

    const movimiento = MovimientoInventario.crear({
      inventarioId: this.id,
      tipoMovimiento: TipoMovimientoEnum.AJUSTE_OPERATIVO,
      cantidad: Math.abs(props.cantidad),
      cantidadAnterior,
      cantidadPosterior: this.cantidadDisponible.obtenerValor(),
      empleadoId: props.empleadoId,
      intencion: props.intencion,
      notas: props.notas,
    });

    this.addDomainEvent(
      new InventarioAjustado(
        this.id,
        cantidadAnterior,
        this.cantidadDisponible.obtenerValor(),
        props.empleadoId,
      ),
    );

    return movimiento;
  }

  verificarDisponibilidad(cantidad: number): boolean {
    return this.cantidadDisponible.esMayorOIgualA(Cantidad.crear(cantidad));
  }

  estaBajoUmbral(umbral: number): boolean {
    return this.cantidadDisponible.obtenerValor() < umbral;
  }

  getDomainEvents(): any[] {
    return this.domainEvents;
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }

  private addDomainEvent(event: any): void {
    this.domainEvents.push(event);
  }
}
