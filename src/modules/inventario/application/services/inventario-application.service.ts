import { Injectable } from '@nestjs/common';
import type { InventarioRepository } from '../../domain/ports/outbound/inventario.repository';
import type { ReservaRepository } from '../../domain/ports/outbound/reserva.repository';
import type { MovimientoInventarioRepository } from '../../domain/ports/outbound/movimiento-inventario.repository';
import type { EventBusPort } from '../../domain/ports/outbound/event-bus.port';
import { Inventario } from '../../domain/aggregates/inventario/inventario.entity';
import { Reserva } from '../../domain/aggregates/inventario/reserva.entity';
import {
  TipoActorEnum,
  TipoItemEnum,
  TipoOperacionEnum,
} from '../../domain/aggregates/inventario/types';
import { InventarioService } from '../../domain/ports/inbound/inventario.service';
import { ReservarInventarioRequestDto } from '../dto/reservar-inventario-request.dto';
import { ConsolidarReservaRequestDto } from '../dto/consolidar-reserva-request.dto';
import { AjustarInventarioRequestDto } from '../dto/ajustar-inventario-request.dto';
import { ConsultarDisponibilidadRequestDto } from '../dto/consultar-disponibilidad-request.dto';
import { InventarioResponseDto } from '../dto/inventario-response.dto';
import { ReservaResponseDto } from '../dto/reserva-response.dto';
import { DisponibilidadResponseDto } from '../dto/disponibilidad-response.dto';
import { InventarioMapper } from '../mappers/inventario.mapper';
import { ReservaMapper } from '../mappers/reserva.mapper';
import { StockBajoDetectado } from '../../domain/events/stock-bajo-detectado.event';

@Injectable()
export class InventarioApplicationService implements InventarioService {
  private readonly DURACION_RESERVA_VENTA_MINUTOS = 20;
  private readonly DURACION_RESERVA_CAMBIO_MINUTOS = 20;
  private readonly UMBRAL_STOCK_BAJO = 10;

  constructor(
    private readonly inventarioRepo: any,
    private readonly reservaRepo: any,
    private readonly movimientoRepo: any,
    private readonly eventBus: any,
  ) {}

  async reservarInventario(
    request: ReservarInventarioRequestDto,
  ): Promise<ReservaResponseDto> {
    // Buscar o crear inventario
    let inventario = await this.inventarioRepo.buscarPorItem(
      request.tipoItem,
      request.itemId,
    );

    if (!inventario) {
      inventario = Inventario.crear({
        tipoItem: request.tipoItem as TipoItemEnum,
        itemId: request.itemId,
      });
      await this.inventarioRepo.guardar(inventario);
    }

    // Calcular duración de reserva
    const duracionMinutos =
      request.tipoOperacion === TipoOperacionEnum.CAMBIO
        ? this.DURACION_RESERVA_CAMBIO_MINUTOS
        : this.DURACION_RESERVA_VENTA_MINUTOS;

    // Reservar en dominio
    const reserva = inventario.reservar({
      cantidad: request.cantidad,
      operacionId: request.operacionId,
      tipoOperacion: request.tipoOperacion as TipoOperacionEnum,
      actorTipo: request.actorTipo as TipoActorEnum,
      actorId: request.actorId,
      minutosExpiracion: duracionMinutos,
    });

    // Guardar cambios atomicamente
    await this.inventarioRepo.guardarConTransaction(inventario, async () => {
      await this.reservaRepo.guardar(reserva);
    });

    // Publicar eventos
    for (const evento of inventario.getDomainEvents()) {
      await this.eventBus.publicar(evento);
    }
    inventario.clearDomainEvents();

    return ReservaMapper.toResponse(reserva);
  }

  async consolidarReserva(request: ConsolidarReservaRequestDto): Promise<void> {
    // Buscar reserva
    const reservas = await this.reservaRepo.buscarActivasPorOperacion(
      request.operacionId,
    );

    if (reservas.length === 0) {
      throw new Error(
        `No se encontró reserva activa para operación ${request.operacionId}`,
      );
    }

    const reserva = reservas[0];

    // Buscar inventario
    const inventario = await this.inventarioRepo.buscarPorId(
      reserva.inventarioId,
    );
    if (!inventario) {
      throw new Error(`Inventario no encontrado: ${reserva.inventarioId}`);
    }

    // Consolidar en dominio
    reserva.consolidar();
    const movimiento = inventario.consolidarReserva(reserva);

    // Guardar atomicamente
    await this.inventarioRepo.guardarConTransaction(inventario, async () => {
      await this.reservaRepo.actualizar(reserva);
      await this.movimientoRepo.guardar(movimiento);
    });

    // Publicar eventos
    for (const evento of inventario.getDomainEvents()) {
      await this.eventBus.publicar(evento);
    }
    inventario.clearDomainEvents();
  }

  async liberarReservasExpiradas(): Promise<void> {
    const reservasExpiradas = await this.reservaRepo.buscarExpiradas();

    for (const reserva of reservasExpiradas) {
      const inventario = await this.inventarioRepo.buscarPorId(
        reserva.inventarioId,
      );

      if (!inventario) {
        continue;
      }

      reserva.expirar();
      const movimiento = inventario.liberarReserva(reserva);

      await this.inventarioRepo.guardarConTransaction(inventario, async () => {
        await this.reservaRepo.actualizar(reserva);
        await this.movimientoRepo.guardar(movimiento);
      });

      for (const evento of inventario.getDomainEvents()) {
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
      throw new Error(`Inventario no encontrado: ${request.inventarioId}`);
    }

    // TODO: Validar permisos empleado (SEGURIDAD)

    const movimiento = inventario.ajustar({
      cantidad: request.cantidad,
      empleadoId: request.empleadoId,
      intencion: request.intencion,
      notas: request.notas,
    });

    await this.inventarioRepo.guardarConTransaction(inventario, async () => {
      await this.movimientoRepo.guardar(movimiento);
    });

    for (const evento of inventario.getDomainEvents()) {
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

    return {
      disponible,
      cantidadDisponible: inventario.cantidadDisponible.obtenerValor(),
      cantidadSolicitada: request.cantidad,
      mensaje: disponible
        ? 'Stock disponible'
        : `Stock insuficiente: disponible ${inventario.cantidadDisponible.obtenerValor()}, solicitado ${request.cantidad}`,
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
      throw new Error(`Inventario no encontrado para ${tipoItem}/${itemId}`);
    }

    return InventarioMapper.toResponse(inventario);
  }

  async detectarStockBajo(umbral: number): Promise<void> {
    const inventarios = await this.inventarioRepo.buscarTodos();

    for (const inventario of inventarios) {
      if (inventario.estaBajoUmbral(umbral)) {
        const evento = new StockBajoDetectado(
          inventario.id,
          inventario.cantidadDisponible.obtenerValor(),
          umbral,
        );
        await this.eventBus.publicar(evento);
      }
    }
  }
}
