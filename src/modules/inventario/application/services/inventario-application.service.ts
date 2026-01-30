import { Injectable, Inject } from '@nestjs/common';
import {
  EntidadNoEncontradaError,
  EntidadDuplicadaError,
} from '../../domain/exceptions';
import type { InventarioRepository } from '../../domain/ports/outbound/inventario.repository';
import type { EventBusPort } from '../../domain/ports/outbound/event-bus.port';
import type {
  TransactionManager,
  TransactionContext,
} from '../../domain/ports/outbound/transaction-manager.port';
import {
  TipoActorEnum,
  TipoItemEnum,
  TipoOperacionEnum,
} from '../../domain/aggregates/inventario/types';
import type { InventarioService } from '../../domain/ports/inbound/inventario.service';
import { CrearInventarioRequestDto } from '../dto/crear-inventario-request.dto';
import { ReservarInventarioRequestDto } from '../dto/reservar-inventario-request.dto';
import { ConsolidarReservaRequestDto } from '../dto/consolidar-reserva-request.dto';
import { AjustarInventarioRequestDto } from '../dto/ajustar-inventario-request.dto';
import { ConsultarDisponibilidadRequestDto } from '../dto/consultar-disponibilidad-request.dto';
import { EliminarInventarioRequestDto } from '../dto/eliminar-inventario-request.dto';
import { InventarioResponseDto } from '../dto/inventario-response.dto';
import { ReservaResponseDto } from '../dto/reserva-response.dto';
import { DisponibilidadResponseDto } from '../dto/disponibilidad-response.dto';
import { InventarioMapper } from '../mappers/inventario.mapper';
import { ReservaMapper } from '../mappers/reserva.mapper';
import { StockBajoDetectado } from '../../domain/events/stock-bajo-detectado.event';
import { InventarioFactory } from '../../domain/factories';
import {
  Inventario,
  MovimientoInventario,
  Reserva,
} from '@inventario/domain/aggregates/inventario';
import type { ProcesarReservaParams } from '../types/procesar-reserva.types';
import {
  INVENTARIO_REPOSITORY_TOKEN,
  EVENT_BUS_PORT_TOKEN,
  TRANSACTION_MANAGER_TOKEN,
} from '../../domain/ports/tokens';

@Injectable()
export class InventarioApplicationService implements InventarioService {
  private readonly DURACION_RESERVA_VENTA_MINUTOS = 20;
  private readonly DURACION_RESERVA_CAMBIO_MINUTOS = 20;
  private readonly UMBRAL_STOCK_BAJO = 10;
  private readonly DURACION_RESERVA = {
    [TipoOperacionEnum.CAMBIO]: this.DURACION_RESERVA_CAMBIO_MINUTOS,
    [TipoOperacionEnum.VENTA]: this.DURACION_RESERVA_VENTA_MINUTOS,
    [TipoOperacionEnum.AJUSTE]: 0,
  } as const;

  constructor(
    @Inject(INVENTARIO_REPOSITORY_TOKEN)
    private readonly inventarioRepo: InventarioRepository,
    @Inject(EVENT_BUS_PORT_TOKEN)
    private readonly eventBus: EventBusPort,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly transactionManager: TransactionManager,
  ) {}

  /**
   * Crea en 0 para forzar primer movimiento auditado, evitando stock sin origen.
   */
  async crearInventario(
    request: CrearInventarioRequestDto,
  ): Promise<InventarioResponseDto> {
    const existente = await this.inventarioRepo.buscarPorItem(
      request.tipoItem,
      request.itemId,
    );

    if (existente) {
      throw new EntidadDuplicadaError(
        'Inventario',
        `${request.tipoItem}/${request.itemId}`,
      );
    }

    if (request.cantidadInicial < 0) {
      throw new Error('Cantidad inicial no puede ser negativa');
    }

    const inventario = InventarioFactory.crear({
      tipoItem: request.tipoItem as TipoItemEnum,
      itemId: request.itemId,
      ubicacion: request.ubicacion,
    });

    let movimiento: MovimientoInventario | null = null;
    if (request.cantidadInicial > 0) {
      movimiento = inventario.ajustar({
        cantidad: request.cantidadInicial,
        empleadoId: request.empleadoId,
        intencion: MovimientoInventario.INTENCION_ENTRADA_INICIAL,
        notas: request.notas,
      });
    }

    await this.inventarioRepo.guardar(inventario, {
      movimientos: movimiento ? [movimiento] : undefined,
    });

    await this.publicarEventosDominio(inventario);

    return InventarioMapper.toResponse(inventario);
  }

  /**
   * Stock fantasma (ventas sin mercadería) requiere que inventario exista antes de reservar.
   */
  async reservarInventario(
    request: ReservarInventarioRequestDto,
  ): Promise<ReservaResponseDto> {
    const inventario = await this.inventarioRepo.buscarPorItem(
      request.tipoItem,
      request.itemId,
    );

    if (!inventario) {
      throw new EntidadNoEncontradaError(
        'Inventario',
        `${request.tipoItem}/${request.itemId}`,
      );
    }

    const duracionMinutos = this.DURACION_RESERVA[request.tipoOperacion];

    const { reserva, movimiento } = inventario.reservar({
      cantidad: request.cantidad,
      operacionId: request.operacionId,
      tipoOperacion: request.tipoOperacion,
      actorTipo: request.actorTipo,
      actorId: request.actorId,
      minutosExpiracion: duracionMinutos,
    });

    await this.inventarioRepo.guardar(inventario, {
      reservas: { nuevas: [reserva] },
      movimientos: [movimiento],
    });

    await this.publicarEventosDominio(inventario);

    return ReservaMapper.toResponse(reserva);
  }

  /**
   * Consolidates all active reservations for an operation atomically.
   * Uses explicit transaction to ensure all-or-nothing semantics across multiple
   * inventory aggregates. Events are published after successful commit to prevent
   * inconsistency if transaction rolls back.
   */
  async consolidarReserva(request: ConsolidarReservaRequestDto): Promise<void> {
    const inventarios: Inventario[] = [];

    await this.transactionManager.transaction(async (ctx) => {
      const reservas = await this.inventarioRepo.buscarReservasActivas(
        request.operacionId,
        ctx,
      );

      if (!reservas.length) {
        throw new EntidadNoEncontradaError('Reserva', request.operacionId);
      }

      for (const reserva of reservas) {
        const inventario = await this.procesarReserva({
          reserva,
          operacion: (inv, res) => ({
            inventario: inv,
            movimiento: inv.consolidarReserva(res),
          }),
          transactionContext: ctx,
        });

        inventarios.push(inventario);
      }
    });

    for (const inventario of inventarios) {
      await this.publicarEventosDominio(inventario);
    }
  }

  /**
   * Processes expired reservations independently (no shared transaction).
   * Each reservation gets isolated transaction for resilience: if one fails,
   * others continue. Events published immediately after each successful commit.
   */
  async liberarReservasExpiradas(): Promise<void> {
    const reservasExpiradas =
      await this.inventarioRepo.buscarReservasExpiradas();

    for (const reserva of reservasExpiradas) {
      try {
        const inventario = await this.procesarReserva({
          reserva,
          operacion: (inv, res) => ({
            inventario: inv,
            movimiento: inv.expirarReserva(res),
          }),
        });

        await this.publicarEventosDominio(inventario);
      } catch (error) {
        console.error(`Error expirando reserva ${reserva.id}:`, error);
      }
    }
  }

  async ajustarInventario(request: AjustarInventarioRequestDto): Promise<void> {
    const inventario = await this.inventarioRepo.buscarPorId(
      request.inventarioId,
    );

    if (!inventario) {
      throw new EntidadNoEncontradaError('Inventario', request.inventarioId);
    }

    const movimiento = inventario.ajustar({
      cantidad: request.cantidad,
      empleadoId: request.empleadoId,
      intencion: request.intencion,
      notas: request.notas,
    });

    await this.inventarioRepo.guardar(inventario, {
      movimientos: [movimiento],
    });

    await this.publicarEventosDominio(inventario);
  }

  async consultarDisponibilidad(
    request: ConsultarDisponibilidadRequestDto,
  ): Promise<DisponibilidadResponseDto> {
    const inventario = await this.inventarioRepo.buscarPorItem(
      request.tipoItem,
      request.itemId,
    );

    if (!inventario) {
      return {
        disponible: false,
        cantidadDisponible: 0,
        cantidadSolicitada: request.cantidad,
        mensaje: 'Producto no tiene inventario registrado',
      };
    }

    const disponible = inventario.verificarDisponibilidad(request.cantidad);
    const mensaje = disponible
      ? 'Stock disponible'
      : `Stock insuficiente: disponible ${inventario.cantidadDisponible.obtenerValor()}, solicitado ${request.cantidad}`;
    return {
      disponible,
      mensaje,
      cantidadDisponible: inventario.cantidadDisponible.obtenerValor(),
      cantidadSolicitada: request.cantidad,
    };
  }

  async obtenerInventarioPorItem(
    tipoItem: string,
    itemId: string,
  ): Promise<InventarioResponseDto> {
    const inventario = await this.inventarioRepo.buscarPorItem(
      tipoItem,
      itemId,
    );

    if (!inventario) {
      throw new EntidadNoEncontradaError('Inventario', `${tipoItem}/${itemId}`);
    }

    return InventarioMapper.toResponse(inventario);
  }

  async detectarStockBajo(umbral: number): Promise<void> {
    const inventarios =
      await this.inventarioRepo.buscarInventariosBajoUmbral(umbral);

    for (const inventario of inventarios) {
      const evento = new StockBajoDetectado(
        inventario.id,
        inventario.cantidadDisponible.obtenerValor(),
        umbral,
      );
      await this.eventBus.publicar(evento);
    }
  }

  /**
   * Ignores ENTRADA_INICIAL because it's an automatic initialization movement created
   * when inventory is first setup—not a business operation. This allows users to delete
   * freshly created inventories without being blocked by their own initialization record.
   */
  async eliminarInventario(
    request: EliminarInventarioRequestDto,
  ): Promise<void> {
    const inventario = await this.inventarioRepo.buscarPorId(
      request.inventarioId,
    );

    if (!inventario) {
      throw new EntidadNoEncontradaError('Inventario', request.inventarioId);
    }

    const reservas = await this.inventarioRepo.buscarReservasPorInventario(
      inventario.id,
    );
    const movimientos = await this.inventarioRepo.buscarMovimientos(
      inventario.id,
      { limit: 100 },
    );

    const tieneReservas = reservas.length > 0;
    const movimientosSignificativos = movimientos.filter(
      (m) => m.intencion !== MovimientoInventario.INTENCION_ENTRADA_INICIAL,
    );
    const tieneMovimientos = movimientosSignificativos.length > 0;

    const tieneItems = false;

    inventario.eliminar(tieneReservas, tieneMovimientos, tieneItems);
    await this.inventarioRepo.eliminar(inventario);

    await this.publicarEventosDominio(inventario);
  }

  /**
   * Publica eventos de dominio pendientes y limpia la cola del agregado.
   * Debe ejecutarse DESPUÉS de persistir cambios para garantizar consistencia eventual.
   */
  private async publicarEventosDominio(inventario: Inventario): Promise<void> {
    for (const evento of inventario.domainEvents) {
      await this.eventBus.publicar(evento);
    }
    inventario.clearDomainEvents();
  }

  /**
   * Processes a single reservation by executing domain operation and persisting changes.
   * Returns modified inventory to allow event capture before publishing (caller responsibility).
   * Transaction context propagation enables atomic multi-reservation operations.
   */
  private async procesarReserva(
    params: ProcesarReservaParams,
  ): Promise<Inventario> {
    const { reserva, operacion, transactionContext } = params;

    const inventario = await this.inventarioRepo.buscarPorId(
      reserva.inventarioId,
      transactionContext,
    );

    if (!inventario) {
      throw new EntidadNoEncontradaError('Inventario', reserva.inventarioId);
    }

    const { inventario: inventarioModificado, movimiento } = operacion(
      inventario,
      reserva,
    );

    await this.inventarioRepo.guardar(inventarioModificado, {
      reservas: { actualizadas: [reserva] },
      movimientos: [movimiento],
      transactionContext,
    });

    return inventarioModificado;
  }
}
