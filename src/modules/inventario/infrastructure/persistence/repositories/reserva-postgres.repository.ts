import { Injectable } from '@nestjs/common';
import { Reserva } from '../../../domain/aggregates/inventario/reserva.entity';
import { EstadoReservaEnum } from '../../../domain/aggregates/inventario/types';
import type { ReservaRepository } from '../../../domain/ports/outbound/reserva.repository';
import { PrismaService } from '../../../../../shared/database/prisma.service';

@Injectable()
export class ReservaPostgresRepository implements ReservaRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async guardar(reserva: Reserva): Promise<void> {
    const prisma = this.prismaService.prisma;

    await prisma.reserva.create({
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

  async buscarPorId(id: string): Promise<Reserva | null> {
    const prisma = this.prismaService.prisma;
    const data = await prisma.reserva.findUnique({ where: { id } });

    return data ? this.mapearADominio(data) : null;
  }

  async buscarActivasPorOperacion(operacionId: string): Promise<Reserva[]> {
    const prisma = this.prismaService.prisma;
    const datos = await prisma.reserva.findMany({
      where: {
        operacionId,
        estado: EstadoReservaEnum.ACTIVA,
      },
    });

    return datos.map((data) => this.mapearADominio(data));
  }

  async buscarExpiradas(): Promise<Reserva[]> {
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

    return datos.map((data) => this.mapearADominio(data));
  }

  async actualizar(reserva: Reserva): Promise<void> {
    const prisma = this.prismaService.prisma;

    await prisma.reserva.update({
      where: { id: reserva.id },
      data: {
        estado: reserva.estado,
        fechaResolucion: reserva.fechaResolucion,
      },
    });
  }

  async buscarPorInventario(inventarioId: string): Promise<Reserva[]> {
    const prisma = this.prismaService.prisma;
    const datos = await prisma.reserva.findMany({
      where: { inventarioId },
    });

    return datos.map((data) => this.mapearADominio(data));
  }

  private mapearADominio(data: any): Reserva {
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
