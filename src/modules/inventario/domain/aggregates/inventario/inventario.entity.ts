import { Cantidad } from '../../value-objects/cantidad';
import { Version } from '../../value-objects/version';
import { EstadoReservaEnum, TipoItemEnum, TipoMovimientoEnum } from './types';
import { Reserva } from './reserva.entity';
import { MovimientoInventario } from './movimiento-inventario.entity';
import { InventarioCreado } from '../../events/inventario-creado.event';
import { InventarioReservado } from '../../events/inventario-reservado.event';
import { InventarioDescontado } from '../../events/inventario-descontado.event';
import { InventarioAjustado } from '../../events/inventario-ajustado.event';
import { InventarioEliminado } from '../../events/inventario-eliminado.event';
import { ReservaExpirada } from '../../events/reserva-expirada.event';
import {
  StockInsuficienteError,
  EstadoInvalidoError,
  InventarioConDependenciasError,
} from '../../exceptions';
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
  | InventarioCreado
  | InventarioReservado
  | InventarioDescontado
  | InventarioAjustado
  | InventarioEliminado
  | ReservaExpirada;

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
  #deleted: boolean = false;
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

  get deleted(): boolean {
    return this.#deleted;
  }

  private constructor() {}

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
    inventario.#deleted = data.deleted ?? false;

    return inventario;
  }

  static crear(id: string, props: CrearInventarioProps): Inventario {
    const inventario = new Inventario();
    inventario.#id = id;
    inventario.#tipoItem = props.tipoItem;
    inventario.#itemId = props.itemId;
    inventario.#ubicacion = props.ubicacion;
    inventario.#cantidadDisponible = Cantidad.crear(0);
    inventario.#cantidadReservada = Cantidad.crear(0);
    inventario.#cantidadAbandono = Cantidad.crear(0);
    inventario.#version = Version.crear(1);
    inventario.#fechaActualizacion = new Date();

    inventario.addDomainEvent(
      new InventarioCreado(id, props.tipoItem, props.itemId),
    );

    return inventario;
  }

  /**
   * MovimientoInventario tipo RESERVA cumple invariante: todo cambio de cantidad debe auditarse.
   *
   * @throws StockInsuficienteError
   */
  reservar(props: ReservarInventarioProps): {
    reserva: Reserva;
    movimiento: MovimientoInventario;
  } {
    const cantidadSolicitada = Cantidad.crear(props.cantidad);

    if (!this.cantidadDisponible.esMayorOIgualA(cantidadSolicitada)) {
      throw new StockInsuficienteError(
        this.cantidadDisponible.obtenerValor(),
        props.cantidad,
      );
    }

    const cantidadDisponibleAnterior = this.#cantidadDisponible.obtenerValor();

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

    const movimiento = MovimientoInventarioFactory.crear({
      inventarioId: this.id,
      tipoMovimiento: TipoMovimientoEnum.RESERVA,
      cantidad: props.cantidad,
      cantidadAnterior: cantidadDisponibleAnterior,
      cantidadPosterior: this.#cantidadDisponible.obtenerValor(),
      tipoOperacionOrigen: props.tipoOperacion,
      operacionOrigenId: props.operacionId,
    });

    this.addDomainEvent(
      new InventarioReservado(
        reserva.id,
        this.id,
        props.cantidad,
        props.operacionId,
      ),
    );

    return { reserva, movimiento };
  }

  /**
   * Validación antes de consolidar garantiza atomicidad, evitando estado inconsistente.
   *
   * @throws EstadoInvalidoError
   */
  consolidarReserva(reserva: Reserva): MovimientoInventario {
    if (reserva.estaExpirada()) {
      throw new EstadoInvalidoError(
        'No se puede consolidar una reserva expirada',
      );
    }

    if (reserva.estado !== EstadoReservaEnum.ACTIVA) {
      throw new EstadoInvalidoError(
        'Solo se pueden consolidar reservas activas',
      );
    }

    reserva.consolidar();

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
   * @throws EstadoInvalidoError
   */
  liberarReserva(reserva: Reserva): MovimientoInventario {
    if (reserva.estado !== EstadoReservaEnum.ACTIVA) {
      throw new EstadoInvalidoError('Solo se pueden liberar reservas activas');
    }

    reserva.liberar();

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
   * @throws EstadoInvalidoError
   */
  expirarReserva(reserva: Reserva): MovimientoInventario {
    if (reserva.estado !== EstadoReservaEnum.ACTIVA) {
      throw new EstadoInvalidoError('Solo se pueden expirar reservas activas');
    }

    reserva.expirar();

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

    this.addDomainEvent(
      new ReservaExpirada(reserva.id, this.id, reserva.cantidad),
    );

    return movimiento;
  }

  /**
   * @param props.cantidad Positivo: entrada | Negativo: salida
   * @throws StockInsuficienteError
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

  /**
   * Soft delete: can only be performed if no active reservas, movements (except ENTRADA_INICIAL),
   * or catalog items. Dependencies validated before calling this method.
   * @throws InventarioConDependenciasError
   */
  eliminar(
    tieneReservas: boolean,
    tieneMovimientos: boolean,
    tieneItems: boolean,
  ): void {
    if (tieneReservas) {
      throw new InventarioConDependenciasError(
        'No se puede eliminar inventario con reservas activas',
      );
    }

    if (tieneMovimientos) {
      throw new InventarioConDependenciasError(
        'No se puede eliminar inventario que tiene movimientos registrados',
      );
    }

    if (tieneItems) {
      throw new InventarioConDependenciasError(
        'No se puede eliminar inventario que tiene items asociados',
      );
    }

    this.#deleted = true;
    this.#version = this.#version.incrementar();
    this.#fechaActualizacion = new Date();

    this.addDomainEvent(
      new InventarioEliminado(this.id, this.tipoItem, this.itemId),
    );
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
