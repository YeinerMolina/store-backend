import { Injectable } from '@nestjs/common';
import {
  EntidadNoEncontradaError,
  EntidadDuplicadaError,
} from '../../domain/exceptions';
import type { InventarioRepository } from '../../domain/ports/outbound/inventario.repository';
import type { EventBusPort } from '../../domain/ports/outbound/event-bus.port';
import {
  TipoActorEnum,
  TipoItemEnum,
  TipoOperacionEnum,
} from '../../domain/aggregates/inventario/types';
import { InventarioService } from '../../domain/ports/inbound/inventario.service';
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
import { MovimientoInventario } from '@inventario/domain/aggregates/inventario';

@Injectable()
export class InventarioApplicationService implements InventarioService {
  private readonly DURACION_RESERVA_VENTA_MINUTOS = 20;
  private readonly DURACION_RESERVA_CAMBIO_MINUTOS = 20;
  private readonly UMBRAL_STOCK_BAJO = 10;

  constructor(
    private readonly inventarioRepo: InventarioRepository,
    private readonly eventBus: EventBusPort,
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
        intencion: 'ENTRADA_INICIAL',
        notas: request.notas,
      });
    }

    await this.inventarioRepo.guardar(inventario, {
      movimientos: movimiento ? [movimiento] : undefined,
    });

    for (const evento of inventario.domainEvents) {
      await this.eventBus.publicar(evento);
    }
    inventario.clearDomainEvents();

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

    const duracionMinutos =
      request.tipoOperacion === TipoOperacionEnum.CAMBIO
        ? this.DURACION_RESERVA_CAMBIO_MINUTOS
        : this.DURACION_RESERVA_VENTA_MINUTOS;

    const { reserva, movimiento } = inventario.reservar({
      cantidad: request.cantidad,
      operacionId: request.operacionId,
      tipoOperacion: request.tipoOperacion as TipoOperacionEnum,
      actorTipo: request.actorTipo as TipoActorEnum,
      actorId: request.actorId,
      minutosExpiracion: duracionMinutos,
    });

    await this.inventarioRepo.guardar(inventario, {
      reservas: { nuevas: [reserva] },
      movimientos: [movimiento],
    });

    for (const evento of inventario.domainEvents) {
      await this.eventBus.publicar(evento);
    }
    inventario.clearDomainEvents();

    return ReservaMapper.toResponse(reserva);
  }

  /**
   * Delegación al agregado garantiza atomicidad entre validación y cambio de estado.
   */
  async consolidarReserva(request: ConsolidarReservaRequestDto): Promise<void> {
    const reservas = await this.inventarioRepo.buscarReservasActivas(
      request.operacionId,
    );

    if (reservas.length === 0) {
      throw new EntidadNoEncontradaError('Reserva', request.operacionId);
    }

    for (const reserva of reservas) {
      const inventario = await this.inventarioRepo.buscarPorId(
        reserva.inventarioId,
      );
      if (!inventario) {
        throw new EntidadNoEncontradaError('Inventario', reserva.inventarioId);
      }

      const movimiento = inventario.consolidarReserva(reserva);

      await this.inventarioRepo.guardar(inventario, {
        reservas: { actualizadas: [reserva] },
        movimientos: [movimiento],
      });

      for (const evento of inventario.domainEvents) {
        await this.eventBus.publicar(evento);
      }
      inventario.clearDomainEvents();
    }
  }

  async liberarReservasExpiradas(): Promise<void> {
    const reservasExpiradas =
      await this.inventarioRepo.buscarReservasExpiradas();

    for (const reserva of reservasExpiradas) {
      const inventario = await this.inventarioRepo.buscarPorId(
        reserva.inventarioId,
      );

      if (!inventario) {
        continue;
      }

      const movimiento = inventario.expirarReserva(reserva);

      await this.inventarioRepo.guardar(inventario, {
        reservas: { actualizadas: [reserva] },
        movimientos: [movimiento],
      });

      for (const evento of inventario.domainEvents) {
        await this.eventBus.publicar(evento);
      }
      inventario.clearDomainEvents();
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

    for (const evento of inventario.domainEvents) {
      await this.eventBus.publicar(evento);
    }
    inventario.clearDomainEvents();
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
   * Elimina inventario si no tiene dependencias (reservas activas, movimientos o items)
   * La eliminación es lógica (soft delete)
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

    // Verificar dependencias
    const reservas = await this.inventarioRepo.buscarReservasPorInventario(
      inventario.id,
    );
    const movimientos = await this.inventarioRepo.buscarMovimientos(
      inventario.id,
      { limit: 1 },
    );

    const tieneReservas = reservas.length > 0;
    const tieneMovimientos = movimientos.length > 0;
    // TODO: Verificar si hay items asociados cuando CATALOGO esté disponible
    const tieneItems = false;

    // Lanzar excepción si hay dependencias
    inventario.eliminar(tieneReservas, tieneMovimientos, tieneItems);

    // Guardar cambio
    await this.inventarioRepo.eliminar(inventario);

    // Publicar evento
    for (const evento of inventario.domainEvents) {
      await this.eventBus.publicar(evento);
    }
    inventario.clearDomainEvents();
  }
}
