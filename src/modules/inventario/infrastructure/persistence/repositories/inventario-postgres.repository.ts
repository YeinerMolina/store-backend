import { Injectable } from '@nestjs/common';
import { Inventario } from '../../../domain/aggregates/inventario/inventario.entity';
import { Reserva } from '../../../domain/aggregates/inventario/reserva.entity';
import { MovimientoInventario } from '../../../domain/aggregates/inventario/movimiento-inventario.entity';
import {
  EstadoReservaEnum,
  TipoItemEnum,
  TipoOperacionEnum,
  TipoActorEnum,
} from '../../../domain/aggregates/inventario/types';
import type {
  InventarioRepository,
  GuardarInventarioOptions,
  TransactionContext,
  BuscarMovimientosOptions,
} from '../../../domain/ports/outbound/inventario.repository';
import { PrismaInventarioMapper } from '../mappers/prisma-inventario.mapper';
import { PrismaMovimientoInventarioMapper } from '../mappers/prisma-movimiento-inventario.mapper';
import { PrismaService } from '../../../../../shared/database/prisma.service';
import { OptimisticLockingError } from '../../../domain/exceptions';
import type { PrismaTransactionClient } from '../types/prisma-transaction.type';
import type { Reserva as PrismaReserva } from '@prisma/client';

@Injectable()
export class InventarioPostgresRepository implements InventarioRepository {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Persists an inventory aggregate with related changes (reservations and movements).
   * Executes all operations in a single transaction to ensure consistency.
   * Uses optimistic locking on inventory updates to detect concurrent modifications.
   */
  async guardar(
    inventario: Inventario,
    options?: GuardarInventarioOptions,
  ): Promise<void> {
    const ejecutarGuardado = async (tx: PrismaTransactionClient) => {
      // Persist inventory first (root aggregate) before dependent entities
      await this.persistirInventario(tx, inventario);

      // Order matters: new reservations before updates, then movements for audit trail
      if (options?.reservas?.nuevas) {
        await this.guardarReservasNuevas(tx, options.reservas.nuevas);
      }

      if (options?.reservas?.actualizadas) {
        await this.actualizarReservas(tx, options.reservas.actualizadas);
      }

      if (options?.movimientos) {
        await this.crearMovimientos(tx, options.movimientos);
      }
    };

    await this.ejecutarConTransaccion(
      ejecutarGuardado,
      options?.transactionContext,
    );
  }

  /**
   * Executes a function within a database transaction.
   * Reuses external transaction if provided, otherwise creates new one.
   * Ensures ACID properties for complex multi-table operations.
   */
  private async ejecutarConTransaccion(
    fn: (tx: PrismaTransactionClient) => Promise<void>,
    ctx?: TransactionContext,
  ): Promise<void> {
    if (ctx) {
      await fn(ctx);
    } else {
      await this.prismaService.prisma.$transaction(fn);
    }
  }

  /**
   * Updates an inventory record with optimistic locking (version check).
   * Only succeeds if version matches expected previous version.
   * Prevents concurrent modification conflicts.
   * Supports additional WHERE filters (e.g., deleted=false for soft-delete protection).
   * @throws OptimisticLockingError if version mismatch or record doesn't exist
   */
  private async actualizarInventarioConVersionCheck(
    tx: PrismaTransactionClient,
    inventarioId: string,
    versionAnterior: number,
    data: Record<string, unknown>,
    filtrosAdicionales?: Record<string, unknown>,
  ): Promise<void> {
    const resultado = await tx.inventario.updateMany({
      where: {
        id: inventarioId,
        version: versionAnterior,
        ...filtrosAdicionales,
      },
      data,
    });

    if (resultado.count === 0) {
      throw new OptimisticLockingError('Inventario', inventarioId);
    }
  }

  /**
   * Creates or updates an inventory record with optimistic locking.
   * New inventories are created as-is; existing ones require version match to prevent conflicts.
   * Soft-deleted inventories (deleted=true) are never updated directly.
   * @throws OptimisticLockingError if version mismatch detected on update
   */
  private async persistirInventario(
    tx: PrismaTransactionClient,
    inventario: Inventario,
  ): Promise<void> {
    const data = PrismaInventarioMapper.toPersistence(inventario);
    const existe = await tx.inventario.findUnique({
      where: { id: inventario.id },
    });

    if (!existe) {
      await tx.inventario.create({ data });
      return;
    }

    // Update with version check: only succeeds if version matches
    // Excludes deleted records from optimization check (they cannot be revived here)
    const versionAnterior = data.version - 1;
    await this.actualizarInventarioConVersionCheck(
      tx,
      inventario.id,
      versionAnterior,
      data,
      { deleted: false },
    );
  }

  /**
   * Batch-creates new reservations in a single transaction.
   * Extracts expiration date from value object (obtenerFecha).
   */
  private async guardarReservasNuevas(
    tx: PrismaTransactionClient,
    reservas: Reserva[],
  ): Promise<void> {
    if (reservas.length === 0) {
      return;
    }

    for (const reserva of reservas) {
      await tx.reserva.create({
        data: {
          id: reserva.id,
          inventarioId: reserva.inventarioId,
          tipoOperacion: reserva.tipoOperacion,
          operacionId: reserva.operacionId,
          cantidad: reserva.cantidad,
          estado: reserva.estado,
          fechaCreacion: reserva.fechaCreacion,
          fechaExpiracion: reserva.fechaExpiracion.obtenerFecha(),
          actorTipo: reserva.actorTipo,
          actorId: reserva.actorId,
        },
      });
    }
  }

  /**
   * Updates reservation state and resolution dates.
   * Typically called when reservations expire, are confirmed, or are cancelled.
   */
  private async actualizarReservas(
    tx: PrismaTransactionClient,
    reservas: Reserva[],
  ): Promise<void> {
    if (reservas.length === 0) {
      return;
    }

    for (const reserva of reservas) {
      await tx.reserva.update({
        where: { id: reserva.id },
        data: {
          estado: reserva.estado,
          fechaResolucion: reserva.fechaResolucion,
        },
      });
    }
  }

  /**
   * Records inventory movements in audit trail (INSERT-only, immutable).
   * Movements capture before/after quantities and operation context for traceability.
   */
  private async crearMovimientos(
    tx: PrismaTransactionClient,
    movimientos: MovimientoInventario[],
  ): Promise<void> {
    if (movimientos.length === 0) {
      return;
    }

    for (const movimiento of movimientos) {
      await tx.movimientoInventario.create({
        data: {
          id: movimiento.id,
          inventarioId: movimiento.inventarioId,
          tipoMovimiento: movimiento.tipoMovimiento,
          cantidad: movimiento.cantidad,
          cantidadAnterior: movimiento.cantidadAnterior,
          cantidadPosterior: movimiento.cantidadPosterior,
          tipoOperacionOrigen: movimiento.tipoOperacionOrigen ?? null,
          operacionOrigenId: movimiento.operacionOrigenId ?? null,
          empleadoId: movimiento.empleadoId ?? null,
          intencion: movimiento.intencion ?? null,
          notas: movimiento.notas ?? null,
          fechaMovimiento: movimiento.fechaMovimiento,
        },
      });
    }
  }

  async buscarPorId(
    id: string,
    ctx?: TransactionContext,
  ): Promise<Inventario | null> {
    const prismaCtx = ctx || this.prismaService.prisma;
    const data = await prismaCtx.inventario.findUnique({
      where: { id, deleted: false },
    });

    return data
      ? Inventario.desde(PrismaInventarioMapper.toDomain(data))
      : null;
  }

  async buscarPorItem(
    tipoItem: string,
    itemId: string,
    ctx?: TransactionContext,
  ): Promise<Inventario | null> {
    const prismaCtx = ctx || this.prismaService.prisma;
    const data = await prismaCtx.inventario.findUnique({
      where: {
        idx_inventario_item: {
          tipoItem: tipoItem as TipoItemEnum,
          itemId,
        },
        deleted: false,
      },
    });

    return data
      ? Inventario.desde(PrismaInventarioMapper.toDomain(data))
      : null;
  }

  async buscarTodos(ctx?: TransactionContext): Promise<Inventario[]> {
    const prismaCtx = ctx || this.prismaService.prisma;
    const datos = await prismaCtx.inventario.findMany({
      where: { deleted: false },
    });
    return datos.map((data) =>
      Inventario.desde(PrismaInventarioMapper.toDomain(data)),
    );
  }

  async buscarInventariosBajoUmbral(
    umbral: number,
    ctx?: TransactionContext,
  ): Promise<Inventario[]> {
    const prismaCtx = ctx || this.prismaService.prisma;
    const datos = await prismaCtx.inventario.findMany({
      where: {
        deleted: false,
        cantidadDisponible: {
          lt: umbral,
        },
      },
    });
    return datos.map((data) =>
      Inventario.desde(PrismaInventarioMapper.toDomain(data)),
    );
  }

  async buscarReservasActivas(
    operacionId: string,
    ctx?: TransactionContext,
  ): Promise<Reserva[]> {
    const prismaCtx = ctx || this.prismaService.prisma;
    const datos = await prismaCtx.reserva.findMany({
      where: {
        operacionId,
        estado: EstadoReservaEnum.ACTIVA,
      },
    });

    return datos.map((data) => this.mapearReservaADominio(data));
  }

  async buscarReservasExpiradas(ctx?: TransactionContext): Promise<Reserva[]> {
    const prismaCtx = ctx || this.prismaService.prisma;
    const ahora = new Date();

    const datos = await prismaCtx.reserva.findMany({
      where: {
        estado: EstadoReservaEnum.ACTIVA,
        fechaExpiracion: {
          lt: ahora,
        },
      },
    });

    return datos.map((data) => this.mapearReservaADominio(data));
  }

  async buscarReservasPorInventario(
    inventarioId: string,
    ctx?: TransactionContext,
  ): Promise<Reserva[]> {
    const prismaCtx = ctx || this.prismaService.prisma;
    const datos = await prismaCtx.reserva.findMany({
      where: { inventarioId },
    });

    return datos.map((data) => this.mapearReservaADominio(data));
  }

  /**
   * Fetches inventory movements paginated and ordered by most recent first.
   * Uses default pagination (limit=100, offset=0) for memory efficiency.
   * Returns movements newest-first to facilitate activity tracking and debugging.
   */
  async buscarMovimientos(
    inventarioId: string,
    options?: BuscarMovimientosOptions,
  ): Promise<MovimientoInventario[]> {
    const prismaCtx = options?.transactionContext ?? this.prismaService.prisma;

    const datos = await prismaCtx.movimientoInventario.findMany({
      where: { inventarioId },
      orderBy: { fechaMovimiento: 'desc' },
      take: options?.limit ?? 100,
      skip: options?.offset ?? 0,
    });

    return datos.map((data) =>
      MovimientoInventario.desde(
        PrismaMovimientoInventarioMapper.toDomain(data),
      ),
    );
  }

  /**
   * Soft-deletes an inventory record (marks as deleted=true with optimistic locking).
   * This is logical deletion; the record remains in database for audit trail.
   * Prevents reviving already-deleted records (only updates if deleted=false).
   * @throws OptimisticLockingError if version mismatch detected or already deleted
   */
  async eliminar(
    inventario: Inventario,
    ctx?: TransactionContext,
  ): Promise<void> {
    const ejecutarEliminacion = async (tx: PrismaTransactionClient) => {
      const data = PrismaInventarioMapper.toPersistence(inventario);
      const versionAnterior = data.version - 1;

      // Use centralized version check logic with protection against re-deleting
      await this.actualizarInventarioConVersionCheck(
        tx,
        inventario.id,
        versionAnterior,
        {
          deleted: true,
          version: data.version,
          fechaActualizacion: data.fechaActualizacion,
        },
        { deleted: false }, // ← Only delete if not already deleted
      );
    };

    await this.ejecutarConTransaccion(ejecutarEliminacion, ctx);
  }

  /**
   * Maps Prisma Reserva record to domain Reserva aggregate.
   * Handles all fields including nullable resolution dates and actor information.
   */
  private mapearReservaADominio(data: PrismaReserva): Reserva {
    return Reserva.desde({
      id: data.id,
      inventarioId: data.inventarioId,
      tipoOperacion: data.tipoOperacion as TipoOperacionEnum,
      operacionId: data.operacionId,
      cantidad: data.cantidad,
      estado: data.estado as EstadoReservaEnum,
      fechaCreacion: data.fechaCreacion,
      fechaExpiracion: data.fechaExpiracion,
      fechaResolucion: data.fechaResolucion ?? undefined,
      actorTipo: data.actorTipo as TipoActorEnum,
      actorId: data.actorId,
    });
  }
}
