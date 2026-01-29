import { Injectable } from '@nestjs/common';
import { Inventario } from '../../../domain/aggregates/inventario/inventario.entity';
import { Reserva } from '../../../domain/aggregates/inventario/reserva.entity';
import { MovimientoInventario } from '../../../domain/aggregates/inventario/movimiento-inventario.entity';
import {
  EstadoReservaEnum,
  TipoItemEnum,
  TipoMovimientoEnum,
  TipoOperacionEnum,
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

  async guardar(
    inventario: Inventario,
    options?: GuardarInventarioOptions,
  ): Promise<void> {
    const ejecutarGuardado = async (tx: PrismaTransactionClient) => {
      const data = PrismaInventarioMapper.toPersistence(inventario);

      const existe = await tx.inventario.findUnique({
        where: { id: inventario.id },
      });

      if (!existe) {
        await tx.inventario.create({ data });
      } else {
        const versionAnterior = data.version - 1;

        const resultado = await tx.inventario.updateMany({
          where: {
            id: inventario.id,
            version: versionAnterior,
          },
          data,
        });

        if (resultado.count === 0) {
          throw new OptimisticLockingError('Inventario', inventario.id);
        }
      }

      if (options?.reservas?.nuevas) {
        for (const reserva of options.reservas.nuevas) {
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

      if (options?.reservas?.actualizadas) {
        for (const reserva of options.reservas.actualizadas) {
          await tx.reserva.update({
            where: { id: reserva.id },
            data: {
              estado: reserva.estado,
              fechaResolucion: reserva.fechaResolucion,
            },
          });
        }
      }

      if (options?.movimientos) {
        for (const movimiento of options.movimientos) {
          await tx.movimientoInventario.create({
            data: {
              id: movimiento.id,
              inventarioId: movimiento.inventarioId,
              tipoMovimiento: movimiento.tipoMovimiento,
              cantidad: movimiento.cantidad,
              cantidadAnterior: movimiento.cantidadAnterior,
              cantidadPosterior: movimiento.cantidadPosterior,
              tipoOperacionOrigen: movimiento.tipoOperacionOrigen || null,
              operacionOrigenId: movimiento.operacionOrigenId || null,
              empleadoId: movimiento.empleadoId || null,
              intencion: movimiento.intencion || null,
              notas: movimiento.notas || null,
              fechaMovimiento: movimiento.fechaMovimiento,
            },
          });
        }
      }
    };

    const ctx = options?.transactionContext;
    if (ctx) {
      await ejecutarGuardado(ctx);
    } else {
      await this.prismaService.prisma.$transaction(ejecutarGuardado);
    }
  }

  async buscarPorId(
    id: string,
    ctx?: TransactionContext,
  ): Promise<Inventario | null> {
    const prismaCtx = ctx || this.prismaService.prisma;
    const data = await prismaCtx.inventario.findUnique({
      where: { id },
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
      },
    });

    return data
      ? Inventario.desde(PrismaInventarioMapper.toDomain(data))
      : null;
  }

  async buscarTodos(ctx?: TransactionContext): Promise<Inventario[]> {
    const prismaCtx = ctx || this.prismaService.prisma;
    const datos = await prismaCtx.inventario.findMany();
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
