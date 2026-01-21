import { Injectable } from '@nestjs/common';
import { MovimientoInventario } from '../../../domain/aggregates/inventario/movimiento-inventario.entity';
import type { MovimientoInventarioRepository } from '../../../domain/ports/outbound/movimiento-inventario.repository';
import { PrismaService } from '../../../../../shared/database/prisma.service';

@Injectable()
export class MovimientoInventarioPostgresRepository implements MovimientoInventarioRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async guardar(movimiento: MovimientoInventario): Promise<void> {
    const prisma = this.prismaService.prisma;

    await prisma.movimientoInventario.create({
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

  async buscarPorInventario(
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
}
