import { EstadoReservaEnum, TipoActorEnum, TipoOperacionEnum } from './types';
import { FechaExpiracion } from '../../value-objects/fecha-expiracion';
import { EstadoInvalidoError } from '../../exceptions';
import type { CrearReservaProps, ReservaData } from './reserva.types';

/**
 * Entidad Reserva - Parte del agregado Inventario
 *
 * Responsabilidades:
 * - Bloquear inventario temporalmente para operaciones (ventas/cambios)
 * - Controlar expiración automática (20 minutos default)
 * - Gestionar ciclo de vida: ACTIVA → CONSOLIDADA | LIBERADA | EXPIRADA
 * - Auditar quién reservó y para qué operación
 */
export class Reserva {
  // Propiedades privadas inmutables (identidad)
  #id: string;
  #inventarioId: string;
  #tipoOperacion: TipoOperacionEnum;
  #operacionId: string;
  #cantidad: number;
  #fechaCreacion: Date;
  #fechaExpiracion: FechaExpiracion;
  #actorTipo: TipoActorEnum;
  #actorId: string;

  // Propiedades privadas modificables
  #estado: EstadoReservaEnum;
  #fechaResolucion?: Date;

  get id(): string {
    return this.#id;
  }

  get inventarioId(): string {
    return this.#inventarioId;
  }

  get tipoOperacion(): TipoOperacionEnum {
    return this.#tipoOperacion;
  }

  get operacionId(): string {
    return this.#operacionId;
  }

  get cantidad(): number {
    return this.#cantidad;
  }

  get fechaCreacion(): Date {
    return this.#fechaCreacion;
  }

  get fechaExpiracion(): FechaExpiracion {
    return this.#fechaExpiracion;
  }

  get actorTipo(): TipoActorEnum {
    return this.#actorTipo;
  }

  get actorId(): string {
    return this.#actorId;
  }

  get estado(): EstadoReservaEnum {
    return this.#estado;
  }

  get fechaResolucion(): Date | undefined {
    return this.#fechaResolucion;
  }

  private constructor() {}

  /**
   * Factory method para reconstruir Reserva desde datos de persistencia
   */
  static desde(data: ReservaData): Reserva {
    const reserva = new Reserva();
    reserva.#id = data.id;
    reserva.#inventarioId = data.inventarioId;
    reserva.#tipoOperacion = data.tipoOperacion;
    reserva.#operacionId = data.operacionId;
    reserva.#cantidad = data.cantidad;
    reserva.#estado = data.estado;
    reserva.#fechaCreacion = data.fechaCreacion;
    reserva.#fechaExpiracion = FechaExpiracion.crear(data.fechaExpiracion);
    reserva.#fechaResolucion = data.fechaResolucion;
    reserva.#actorTipo = data.actorTipo;
    reserva.#actorId = data.actorId;

    return reserva;
  }

  /**
   * Verifica si la reserva está expirada según su fecha de expiración
   */
  estaExpirada(): boolean {
    return this.fechaExpiracion.estaExpirada();
  }

  /**
   * Consolida la reserva cuando la venta/cambio se completa exitosamente
   *
   * @throws EstadoInvalidoError si la reserva no está ACTIVA
   */
  consolidar(): void {
    if (this.#estado !== EstadoReservaEnum.ACTIVA) {
      throw new EstadoInvalidoError(
        'Solo se pueden consolidar reservas activas',
      );
    }
    this.#estado = EstadoReservaEnum.CONSOLIDADA;
    this.#fechaResolucion = new Date();
  }

  /**
   * Libera la reserva devolviendo inventario a disponible
   * Usado cuando la operación se cancela antes de completarse
   *
   * @throws EstadoInvalidoError si la reserva no está ACTIVA
   */
  liberar(): void {
    if (this.#estado !== EstadoReservaEnum.ACTIVA) {
      throw new EstadoInvalidoError('Solo se pueden liberar reservas activas');
    }
    this.#estado = EstadoReservaEnum.LIBERADA;
    this.#fechaResolucion = new Date();
  }

  /**
   * Marca la reserva como expirada por timeout
   * Llamado por job background que procesa reservas vencidas
   *
   * @throws EstadoInvalidoError si la reserva no está ACTIVA
   */
  expirar(): void {
    if (this.#estado !== EstadoReservaEnum.ACTIVA) {
      throw new EstadoInvalidoError('Solo se pueden expirar reservas activas');
    }
    this.#estado = EstadoReservaEnum.EXPIRADA;
    this.#fechaResolucion = new Date();
  }
}
