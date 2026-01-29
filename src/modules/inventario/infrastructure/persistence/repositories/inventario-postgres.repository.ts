import { Injectable } from '@nestjs/common';
import { Inventario } from '../../../domain/aggregates/inventario/inventario.entity';
import { Reserva } from '../../../domain/aggregates/inventario/reserva.entity';
import { MovimientoInventario } from '../../../domain/aggregates/inventario/movimiento-inventario.entity';
import {
  EstadoReservaEnum,
  TipoItemEnum,
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

    const ctx = options?.transactionContext;
    if (ctx) {
      await ejecutarGuardado(ctx);
    } else {
      await this.prismaService.prisma.$transaction(ejecutarGuardado);
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
    const resultado = await tx.inventario.updateMany({
      where: {
        id: inventario.id,
        version: versionAnterior,
        deleted: false,
      },
      data,
    });

    if (resultado.count === 0) {
      throw new OptimisticLockingError('Inventario', inventario.id);
    }
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

  async buscarMovimientos(
    inventarioId: string,
    options?: BuscarMovimientosOptions,
  ): Promise<MovimientoInventario[]> {
    const prismaCtx = options?.transactionContext || this.prismaService.prisma;

    const datos = await prismaCtx.movimientoInventario.findMany({
      where: { inventarioId },
      orderBy: { fechaMovimiento: 'desc' },
      take: options?.limit || 100,
      skip: options?.offset || 0,
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
   * @throws OptimisticLockingError if version mismatch detected
   */
  async eliminar(
    inventario: Inventario,
    ctx?: TransactionContext,
  ): Promise<void> {
    const ejecutarEliminacion = async (tx: PrismaTransactionClient) => {
      const data = PrismaInventarioMapper.toPersistence(inventario);
      const versionAnterior = data.version - 1;

      const resultado = await tx.inventario.updateMany({
        where: {
          id: inventario.id,
          version: versionAnterior,
        },
        data: {
          deleted: true,
          version: data.version,
          fechaActualizacion: data.fechaActualizacion,
        },
      });

      if (resultado.count === 0) {
        throw new OptimisticLockingError('Inventario', inventario.id);
      }
    };

    if (ctx) {
      await ejecutarEliminacion(ctx);
    } else {
      await this.prismaService.prisma.$transaction(ejecutarEliminacion);
    }
  }

  private mapearReservaADominio(data: any): Reserva {
    return Reserva.desde({
      id: data.id,
      inventarioId: data.inventarioId,
      tipoOperacion: data.tipoOperacion,
      operacionId: data.operacionId,
      cantidad: data.cantidad,
      estado: data.estado,
      fechaCreacion: data.fechaCreacion,
      fechaExpiracion: data.fechaExpiracion,
      fechaResolucion: data.fechaResolucion,
      actorTipo: data.actorTipo,
      actorId: data.actorId,
    });
  }
}
