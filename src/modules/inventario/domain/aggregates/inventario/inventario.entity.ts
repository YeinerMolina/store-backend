import { Cantidad } from '../../value-objects/cantidad';
import { Version } from '../../value-objects/version';
import { EstadoReservaEnum, TipoItemEnum, TipoMovimientoEnum } from './types';
import { Reserva } from './reserva.entity';
import { MovimientoInventario } from './movimiento-inventario.entity';
import { InventarioReservado } from '../../events/inventario-reservado.event';
import { InventarioDescontado } from '../../events/inventario-descontado.event';
import { InventarioAjustado } from '../../events/inventario-ajustado.event';
import { StockInsuficienteError, EstadoInvalidoError } from '../../exceptions';
import { ReservaFactory } from '../../factories/reserva.factory';
import { MovimientoInventarioFactory } from '../../factories/movimiento-inventario.factory';
import type {
  AjustarInventarioProps,
  CrearInventarioProps,
  InventarioData,
  ReservarInventarioProps,
} from './inventario.types';

/**
 * Base para todos los eventos de dominio
 */
type DomainEvent =
  | InventarioReservado
  | InventarioDescontado
  | InventarioAjustado;

/**
 * Agregado raíz de Inventario
 *
 * Responsabilidades:
 * - Controlar existencias disponibles, reservadas y abandonadas
 * - Gestionar reservas temporales con expiración
 * - Garantizar que no se venda lo que no existe
 * - Registrar movimientos de inventario
 * - Emitir eventos de dominio para cambios de estado
 */
export class Inventario {
  // Propiedades privadas inmutables (identidad)
  #id: string;
  #tipoItem: TipoItemEnum;
  #itemId: string;
  #ubicacion?: string;

  // Propiedades privadas modificables
  #cantidadDisponible: Cantidad;
  #cantidadReservada: Cantidad;
  #cantidadAbandono: Cantidad;
  #version: Version;
  #fechaActualizacion: Date;
  #domainEvents: DomainEvent[] = [];

  get id(): string {
    return this.#id;
  }

  get tipoItem(): TipoItemEnum {
    return this.#tipoItem;
  }

  get itemId(): string {
    return this.#itemId;
  }

  get ubicacion(): string | undefined {
    return this.#ubicacion;
  }

  get cantidadDisponible(): Cantidad {
    return this.#cantidadDisponible;
  }

  get cantidadReservada(): Cantidad {
    return this.#cantidadReservada;
  }

  get cantidadAbandono(): Cantidad {
    return this.#cantidadAbandono;
  }

  get version(): Version {
    return this.#version;
  }

  get fechaActualizacion(): Date {
    return this.#fechaActualizacion;
  }

  private constructor() {}

  /**
   * Factory method para reconstruir Inventario desde datos de persistencia
   */
  static desde(data: InventarioData): Inventario {
    const inventario = new Inventario();
    inventario.#id = data.id;
    inventario.#tipoItem = data.tipoItem;
    inventario.#itemId = data.itemId;
    inventario.#ubicacion = data.ubicacion;
    inventario.#cantidadDisponible = Cantidad.crear(data.cantidadDisponible);
    inventario.#cantidadReservada = Cantidad.crear(data.cantidadReservada);
    inventario.#cantidadAbandono = Cantidad.crear(data.cantidadAbandono);
    inventario.#version = Version.crear(data.version);
    inventario.#fechaActualizacion = data.fechaActualizacion;

    return inventario;
  }

  /**
   * Reserva inventario para una operación (venta o cambio)
   *
   * @throws StockInsuficienteError si no hay stock disponible suficiente
   * @returns Reserva creada con estado ACTIVA
   */
  reservar(props: ReservarInventarioProps): Reserva {
    const cantidadSolicitada = Cantidad.crear(props.cantidad);

    if (!this.cantidadDisponible.esMayorOIgualA(cantidadSolicitada)) {
      throw new StockInsuficienteError(
        this.cantidadDisponible.obtenerValor(),
        props.cantidad,
      );
    }

    this.#cantidadDisponible =
      this.#cantidadDisponible.restar(cantidadSolicitada);
    this.#cantidadReservada = this.#cantidadReservada.sumar(cantidadSolicitada);
    this.#version = this.#version.incrementar();
    this.#fechaActualizacion = new Date();

    const reserva = ReservaFactory.crear({
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

  /**
   * Consolida una reserva confirmando la venta/cambio
   * Descuenta del inventario reservado sin devolver al disponible
   *
   * @throws EstadoInvalidoError si la reserva no está ACTIVA
   * @returns MovimientoInventario de tipo VENTA_SALIDA
   */
  consolidarReserva(reserva: Reserva): MovimientoInventario {
    if (reserva.estado !== EstadoReservaEnum.ACTIVA) {
      throw new EstadoInvalidoError(
        'Solo se pueden consolidar reservas activas',
      );
    }

    const cantidadReservada = Cantidad.crear(reserva.cantidad);
    const cantidadAnterior = this.#cantidadReservada.obtenerValor();

    this.#cantidadReservada = this.#cantidadReservada.restar(cantidadReservada);
    this.#version = this.#version.incrementar();
    this.#fechaActualizacion = new Date();

    const movimiento = MovimientoInventarioFactory.crear({
      inventarioId: this.id,
      tipoMovimiento: TipoMovimientoEnum.VENTA_SALIDA,
      cantidad: reserva.cantidad,
      cantidadAnterior,
      cantidadPosterior: this.#cantidadReservada.obtenerValor(),
      tipoOperacionOrigen: reserva.tipoOperacion,
      operacionOrigenId: reserva.operacionId,
    });

    this.addDomainEvent(
      new InventarioDescontado(this.id, reserva.cantidad, reserva.operacionId),
    );

    return movimiento;
  }

  /**
   * Libera una reserva devolviendo inventario a disponible
   * Usado cuando una venta/cambio se cancela antes de completarse
   *
   * @throws EstadoInvalidoError si la reserva no está ACTIVA
   * @returns MovimientoInventario de tipo LIBERACION
   */
  liberarReserva(reserva: Reserva): MovimientoInventario {
    if (reserva.estado !== EstadoReservaEnum.ACTIVA) {
      throw new EstadoInvalidoError('Solo se pueden liberar reservas activas');
    }

    const cantidadReservada = Cantidad.crear(reserva.cantidad);
    const cantidadAnterior = this.#cantidadReservada.obtenerValor();

    this.#cantidadDisponible =
      this.#cantidadDisponible.sumar(cantidadReservada);
    this.#cantidadReservada = this.#cantidadReservada.restar(cantidadReservada);
    this.#version = this.#version.incrementar();
    this.#fechaActualizacion = new Date();

    const movimiento = MovimientoInventarioFactory.crear({
      inventarioId: this.id,
      tipoMovimiento: TipoMovimientoEnum.LIBERACION,
      cantidad: reserva.cantidad,
      cantidadAnterior,
      cantidadPosterior: this.#cantidadReservada.obtenerValor(),
      tipoOperacionOrigen: reserva.tipoOperacion,
      operacionOrigenId: reserva.operacionId,
    });

    return movimiento;
  }

  /**
   * Ajusta manualmente el inventario disponible (+ para entradas, - para salidas)
   * Usado para correcciones, recepción de mercadería, pérdidas, etc.
   *
   * @param props.cantidad - Positivo: entrada | Negativo: salida
   * @throws StockInsuficienteError si se intenta restar más de lo disponible
   * @returns MovimientoInventario de tipo AJUSTE_OPERATIVO
   */
  ajustar(props: AjustarInventarioProps): MovimientoInventario {
    const cantidadAjuste = Cantidad.crear(Math.abs(props.cantidad));
    const cantidadAnterior = this.#cantidadDisponible.obtenerValor();

    if (props.cantidad > 0) {
      this.#cantidadDisponible = this.#cantidadDisponible.sumar(cantidadAjuste);
    } else {
      if (!this.#cantidadDisponible.esMayorOIgualA(cantidadAjuste)) {
        throw new StockInsuficienteError(
          cantidadAnterior,
          Math.abs(props.cantidad),
        );
      }
      this.#cantidadDisponible =
        this.#cantidadDisponible.restar(cantidadAjuste);
    }

    this.#version = this.#version.incrementar();
    this.#fechaActualizacion = new Date();

    const movimiento = MovimientoInventarioFactory.crear({
      inventarioId: this.id,
      tipoMovimiento: TipoMovimientoEnum.AJUSTE_OPERATIVO,
      cantidad: Math.abs(props.cantidad),
      cantidadAnterior,
      cantidadPosterior: this.#cantidadDisponible.obtenerValor(),
      empleadoId: props.empleadoId,
      intencion: props.intencion,
      notas: props.notas,
    });

    this.addDomainEvent(
      new InventarioAjustado(
        this.id,
        cantidadAnterior,
        this.#cantidadDisponible.obtenerValor(),
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

  get domainEvents(): readonly DomainEvent[] {
    return [...this.#domainEvents];
  }

  clearDomainEvents(): void {
    this.#domainEvents = [];
  }

  private addDomainEvent(event: DomainEvent): void {
    this.#domainEvents.push(event);
  }
}
