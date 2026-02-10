import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  EntidadNoEncontradaError,
  EntidadDuplicadaError,
} from '../../domain/exceptions';
import type { InventarioRepository } from '../../domain/ports/outbound/inventario.repository';
import type { EventBusPort } from '../../domain/ports/outbound/event-bus.port';
import type { TransactionManager } from '@shared/database';
import type { ConfiguracionPort } from '../../domain/ports/outbound/configuracion.port';
import {
  TipoOperacionEnum,
  ParametroConfiguracionInventario,
} from '../../domain/aggregates/inventario/types';
import type { InventarioService } from '../../domain/ports/inbound/inventario.service';
import type {
  CrearInventarioConCantidadProps,
  ReservarInventarioCommand,
  ConsolidarReservaProps,
  AjustarInventarioCommand,
  ConsultarDisponibilidadProps,
  EliminarInventarioProps,
  DisponibilidadResponse,
} from '../../domain/aggregates/inventario/inventario.types';
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
  CONFIGURACION_PORT_TOKEN,
} from '../../domain/ports/tokens';

@Injectable()
export class InventarioApplicationService implements InventarioService {
  private readonly logger = new Logger(InventarioApplicationService.name);

  constructor(
    @Inject(INVENTARIO_REPOSITORY_TOKEN)
    private readonly inventarioRepo: InventarioRepository,
    @Inject(EVENT_BUS_PORT_TOKEN)
    private readonly eventBus: EventBusPort,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly transactionManager: TransactionManager,
    @Inject(CONFIGURACION_PORT_TOKEN)
    private readonly configuracionPort: ConfiguracionPort,
  ) {}

  /**
   * Crea en 0 para forzar primer movimiento auditado, evitando stock sin origen.
   */
  async crearInventario(
    props: CrearInventarioConCantidadProps,
  ): Promise<Inventario> {
    const existente = await this.inventarioRepo.buscarPorItem(
      props.tipoItem,
      props.itemId,
    );

    if (existente) {
      throw new EntidadDuplicadaError(
        'Inventario',
        `${props.tipoItem}/${props.itemId}`,
      );
    }

    if (props.cantidadInicial < 0) {
      throw new Error('Cantidad inicial no puede ser negativa');
    }

    const inventario = InventarioFactory.crear({
      tipoItem: props.tipoItem,
      itemId: props.itemId,
      ubicacion: props.ubicacion,
    });

    let movimiento: MovimientoInventario | null = null;
    if (props.cantidadInicial > 0) {
      movimiento = inventario.ajustar({
        cantidad: props.cantidadInicial,
        empleadoId: props.empleadoId,
        intencion: MovimientoInventario.INTENCION_ENTRADA_INICIAL,
        notas: props.notas,
      });
    }

    await this.inventarioRepo.guardar(inventario, {
      movimientos: movimiento ? [movimiento] : undefined,
    });

    await this.publicarEventosDominio(inventario);

    return inventario;
  }

  async reservarInventario(
    command: ReservarInventarioCommand,
  ): Promise<Reserva> {
    const inventario = await this.inventarioRepo.buscarPorItem(
      command.tipoItem,
      command.itemId,
    );

    if (!inventario) {
      throw new EntidadNoEncontradaError(
        'Inventario',
        `${command.tipoItem}/${command.itemId}`,
      );
    }

    const duracionSegundos = await this.obtenerDuracionReserva(
      command.tipoOperacion,
    );

    const { reserva, movimiento } = inventario.reservar({
      cantidad: command.cantidad,
      operacionId: command.operacionId,
      tipoOperacion: command.tipoOperacion,
      actorTipo: command.actorTipo,
      actorId: command.actorId,
      segundosExpiracion: duracionSegundos,
    });

    await this.inventarioRepo.guardar(inventario, {
      reservas: { nuevas: [reserva] },
      movimientos: [movimiento],
    });

    await this.publicarEventosDominio(inventario);

    return reserva;
  }

  /**
   * Consolidates all active reservations for an operation atomically.
   * Uses explicit transaction to ensure all-or-nothing semantics across multiple
   * inventory aggregates. Events are published after successful commit to prevent
   * inconsistency if transaction rolls back.
   */
  async consolidarReserva(props: ConsolidarReservaProps): Promise<void> {
    const inventarios: Inventario[] = [];

    await this.transactionManager.transaction(async (ctx) => {
      const reservas = await this.inventarioRepo.buscarReservasActivas(
        props.operacionId,
        ctx,
      );

      if (!reservas.length) {
        throw new EntidadNoEncontradaError('Reserva', props.operacionId);
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
      } catch (error: any) {
        this.logger.error(
          `Error expirando reserva ${reserva.id}: ${error.message}`,
          error.stack,
        );
      }
    }
  }

  async ajustarInventario(command: AjustarInventarioCommand): Promise<void> {
    const inventario = await this.inventarioRepo.buscarPorId(
      command.inventarioId,
    );

    if (!inventario) {
      throw new EntidadNoEncontradaError('Inventario', command.inventarioId);
    }

    const movimiento = inventario.ajustar({
      cantidad: command.cantidad,
      empleadoId: command.empleadoId,
      intencion: command.intencion,
      notas: command.notas,
    });

    await this.inventarioRepo.guardar(inventario, {
      movimientos: [movimiento],
    });

    await this.publicarEventosDominio(inventario);
  }

  async consultarDisponibilidad(
    props: ConsultarDisponibilidadProps,
  ): Promise<DisponibilidadResponse> {
    const inventario = await this.inventarioRepo.buscarPorItem(
      props.tipoItem,
      props.itemId,
    );

    if (!inventario) {
      return {
        disponible: false,
        cantidadDisponible: 0,
        cantidadSolicitada: props.cantidad,
        mensaje: 'Producto no tiene inventario registrado',
      };
    }

    const disponible = inventario.verificarDisponibilidad(props.cantidad);
    const mensaje = disponible
      ? 'Stock disponible'
      : `Stock insuficiente: disponible ${inventario.cantidadDisponible.obtenerValor()}, solicitado ${props.cantidad}`;
    return {
      disponible,
      mensaje,
      cantidadDisponible: inventario.cantidadDisponible.obtenerValor(),
      cantidadSolicitada: props.cantidad,
    };
  }

  async obtenerInventarioPorItem(
    tipoItem: string,
    itemId: string,
  ): Promise<Inventario> {
    const inventario = await this.inventarioRepo.buscarPorItem(
      tipoItem,
      itemId,
    );

    if (!inventario) {
      throw new EntidadNoEncontradaError('Inventario', `${tipoItem}/${itemId}`);
    }

    return inventario;
  }

  async detectarStockBajo(): Promise<void> {
    const umbral = await this.configuracionPort.obtenerParametro(
      ParametroConfiguracionInventario.UMBRAL_STOCK_BAJO,
    );

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
  async eliminarInventario(props: EliminarInventarioProps): Promise<void> {
    const inventario = await this.inventarioRepo.buscarPorId(
      props.inventarioId,
    );

    if (!inventario) {
      throw new EntidadNoEncontradaError('Inventario', props.inventarioId);
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
   * Restores a soft-deleted inventory back to active state.
   * Validates that inventory exists AND is actually deleted before restoration.
   * @throws EntidadNoEncontradaError if inventory doesn't exist or is not deleted
   */
  async restaurarInventario(inventarioId: string): Promise<void> {
    const inventario =
      await this.inventarioRepo.buscarEliminadoPorId(inventarioId);

    if (!inventario) {
      throw new EntidadNoEncontradaError(
        'Inventario eliminado (no se puede restaurar un inventario activo)',
        inventarioId,
      );
    }

    inventario.restaurar();

    await this.inventarioRepo.guardar(inventario);
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

  /**
   * AJUSTE operations don't need temporal reservation (0 minutes).
   */
  private async obtenerDuracionReserva(
    tipoOperacion: TipoOperacionEnum,
  ): Promise<number> {
    if (tipoOperacion === TipoOperacionEnum.AJUSTE) {
      return 0;
    }

    const parametro =
      tipoOperacion === TipoOperacionEnum.VENTA
        ? ParametroConfiguracionInventario.DURACION_RESERVA_VENTA
        : ParametroConfiguracionInventario.DURACION_RESERVA_CAMBIO;

    return this.configuracionPort.obtenerParametro(parametro);
  }
}
