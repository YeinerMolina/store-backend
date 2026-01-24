import { Injectable } from '@nestjs/common';
import { Inventario } from '../../../domain/aggregates/inventario/inventario.entity';
import type { InventarioRepository } from '../../../domain/ports/outbound/inventario.repository';
import { PrismaInventarioMapper } from '../mappers/prisma-inventario.mapper';
import { PrismaService } from '../../../../../shared/database/prisma.service';
import { OptimisticLockingError } from '../../../domain/exceptions';

@Injectable()
export class InventarioPostgresRepository implements InventarioRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async guardar(inventario: Inventario): Promise<void> {
    const data = PrismaInventarioMapper.toPersistence(inventario);
    const prisma = this.prismaService.prisma;

    const existe = await prisma.inventario.findUnique({
      where: { id: inventario.id },
    });

    if (!existe) {
      await prisma.inventario.create({ data });
    } else {
      const versionAnterior = data.version - 1;

      const resultado = await prisma.inventario.updateMany({
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

  async guardarConTransaction(
    inventario: Inventario,
    operacionesAdicionales?: () => Promise<void>,
  ): Promise<void> {
    const prisma = this.prismaService.prisma;
    await prisma.$transaction(async () => {
      const data = PrismaInventarioMapper.toPersistence(inventario);

      const existe = await prisma.inventario.findUnique({
        where: { id: inventario.id },
      });

      if (!existe) {
        await prisma.inventario.create({ data });
      } else {
        const versionAnterior = data.version - 1;

        const resultado = await prisma.inventario.updateMany({
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

      if (operacionesAdicionales) {
        await operacionesAdicionales();
      }
    });
  }
}
