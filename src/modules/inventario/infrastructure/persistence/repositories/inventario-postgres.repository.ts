import { Injectable } from '@nestjs/common';
import { Inventario } from '../../../domain/aggregates/inventario/inventario.entity';
import type { InventarioRepository } from '../../../domain/ports/outbound/inventario.repository';
import { PrismaInventarioMapper } from '../mappers/prisma-inventario.mapper';
import { PrismaService } from '../../../../../shared/database/prisma.service';

@Injectable()
export class InventarioPostgresRepository implements InventarioRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async guardar(inventario: Inventario): Promise<void> {
    const data = PrismaInventarioMapper.toPersistence(inventario);
    const prisma = this.prismaService.prisma;

    await prisma.inventario.upsert({
      where: { id: inventario.id },
      update: data,
      create: data,
    });
  }

  async buscarPorId(id: string): Promise<Inventario | null> {
    const prisma = this.prismaService.prisma;
    const data = await prisma.inventario.findUnique({
      where: { id },
    });

    return data ? PrismaInventarioMapper.toDomain(data) : null;
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

    return data ? PrismaInventarioMapper.toDomain(data) : null;
  }

  async buscarTodos(): Promise<Inventario[]> {
    const prisma = this.prismaService.prisma;
    const datos = await prisma.inventario.findMany();
    return datos.map((data) => PrismaInventarioMapper.toDomain(data));
  }

  async guardarConTransaction(
    inventario: Inventario,
    operacionesAdicionales?: () => Promise<void>,
  ): Promise<void> {
    const prisma = this.prismaService.prisma;
    await prisma.$transaction(async () => {
      const data = PrismaInventarioMapper.toPersistence(inventario);

      await prisma.inventario.upsert({
        where: { id: inventario.id },
        update: data,
        create: data,
      });

      if (operacionesAdicionales) {
        await operacionesAdicionales();
      }
    });
  }
}
