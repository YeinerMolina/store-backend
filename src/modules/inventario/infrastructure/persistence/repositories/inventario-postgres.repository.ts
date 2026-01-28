import { Injectable } from '@nestjs/common';
import { Inventario } from '../../../domain/aggregates/inventario/inventario.entity';
import { Reserva } from '../../../domain/aggregates/inventario/reserva.entity';
import { MovimientoInventario } from '../../../domain/aggregates/inventario/movimiento-inventario.entity';
import { EstadoReservaEnum } from '../../../domain/aggregates/inventario/types';
import type {
  InventarioRepository,
  GuardarInventarioOptions,
} from '../../../domain/ports/outbound/inventario.repository';
import { PrismaInventarioMapper } from '../mappers/prisma-inventario.mapper';
import { PrismaService } from '../../../../../shared/database/prisma.service';
import { OptimisticLockingError } from '../../../domain/exceptions';

/**
 * Enforces DDD principle: one aggregate = one repository.
 * Declarative options replace callback pattern for cleaner API.
 */
@Injectable()
export class InventarioPostgresRepository implements InventarioRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async guardar(
    inventario: Inventario,
    options?: GuardarInventarioOptions,
  ): Promise<void> {
    const prisma = this.prismaService.prisma;

    await prisma.$transaction(async (tx) => {
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
    });
  }

  async buscarPorId(id: string): Promise<Inventario | null> {
    const prisma = this.prismaService.prisma;
    const data = await prisma.inventario.findUnique({
      where: { id },
    });

    return data ? Inventario.desde(data) : null;
  }

  async buscarPorItem(
    tipoItem: string,
    itemId: string,
  ): Promise<Inventario | null> {
    const prisma = this.prismaService.prisma;
    const data = await prisma.inventario.findUnique({
      where: {
        idx_inventario_item: {
          tipoItem: tipoItem as any,
          itemId,
        },
      },
    });

    return data ? Inventario.desde(data) : null;
  }

  async buscarTodos(): Promise<Inventario[]> {
    const prisma = this.prismaService.prisma;
    const datos = await prisma.inventario.findMany();
    return datos.map((data) => Inventario.desde(data));
  }

  async buscarReservasActivas(operacionId: string): Promise<Reserva[]> {
    const prisma = this.prismaService.prisma;
    const datos = await prisma.reserva.findMany({
      where: {
        operacionId,
        estado: EstadoReservaEnum.ACTIVA,
      },
    });

    return datos.map((data) => this.mapearReservaADominio(data));
  }

  async buscarReservasExpiradas(): Promise<Reserva[]> {
    const prisma = this.prismaService.prisma;
    const ahora = new Date();

    const datos = await prisma.reserva.findMany({
      where: {
        estado: EstadoReservaEnum.ACTIVA,
        fechaExpiracion: {
          lt: ahora,
        },
      },
    });

    return datos.map((data) => this.mapearReservaADominio(data));
  }

  async buscarReservasPorInventario(inventarioId: string): Promise<Reserva[]> {
    const prisma = this.prismaService.prisma;
    const datos = await prisma.reserva.findMany({
      where: { inventarioId },
    });

    return datos.map((data) => this.mapearReservaADominio(data));
  }

  async buscarMovimientos(
    inventarioId: string,
    limit?: number,
    offset?: number,
  ): Promise<MovimientoInventario[]> {
    const prisma = this.prismaService.prisma;

    const datos = await prisma.movimientoInventario.findMany({
      where: { inventarioId },
      orderBy: { fechaMovimiento: 'desc' },
      take: limit || 100,
      skip: offset || 0,
    });

    return datos.map((data) => MovimientoInventario.desde(data));
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
