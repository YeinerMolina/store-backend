import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';
import { UUID } from '../../../../shared/domain/value-objects/uuid.vo';
import type { VentaRepository } from '../../domain/ports/outbound/venta-repository.port';
import type { Venta } from '../../domain/aggregates/venta.aggregate';
import { VentaPersistenceMapper } from './mappers/venta-persistence.mapper';

/**
 * ADAPTADOR OUTBOUND: VentaRepositoryPostgres
 * Implementa el puerto VentaRepository usando Prisma + PostgreSQL
 * Mapea entre modelos de dominio y modelos de Prisma
 *
 * IMPORTANTE:
 * - El dominio NUNCA conoce a Prisma
 * - Esta clase traduce entre ambos modelos
 *
 * Otras posibles implementaciones:
 * - VentaRepositoryMongo
 * - VentaRepositoryInMemory (para tests)
 */
@Injectable()
export class VentaRepositoryPostgres implements VentaRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async save(venta: Venta): Promise<void> {
    const prismaData = VentaPersistenceMapper.toPrisma(venta);

    await this.prismaService.prisma.venta.create({
      data: prismaData,
    });
  }

  async findById(id: UUID): Promise<Venta | null> {
    const prismaVenta = await this.prismaService.prisma.venta.findUnique({
      where: { id: id.toString() },
      include: {
        lineas_venta: true,
      },
    });

    if (!prismaVenta) {
      return null;
    }

    return VentaPersistenceMapper.toDomain(prismaVenta);
  }

  async findByClienteId(clienteId: UUID): Promise<Venta[]> {
    const prismaVentas = await this.prismaService.prisma.venta.findMany({
      where: { cliente_id: clienteId.toString() },
      include: {
        lineas_venta: true,
      },
      orderBy: { fecha_creacion: 'desc' },
    });

    return prismaVentas.map((v) => VentaPersistenceMapper.toDomain(v));
  }

  async update(venta: Venta): Promise<void> {
    const prismaData = VentaPersistenceMapper.toPrisma(venta);

    await this.prismaService.prisma.venta.update({
      where: { id: venta.getId().toString() },
      data: prismaData,
    });
  }
}
