import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UUID } from '../../../../shared/domain/value-objects/uuid.vo';
import type { IVentaRepository } from '../../domain/ports/outbound/i-venta-repository.port';
import type { Venta } from '../../domain/aggregates/venta.aggregate';
import { VentaPersistenceMapper } from './mappers/venta-persistence.mapper';

/**
 * ADAPTADOR OUTBOUND: PrismaVentaRepository
 * Implementa el puerto IVentaRepository
 * Mapea entre modelos de dominio y modelos de Prisma
 *
 * IMPORTANTE:
 * - El dominio NUNCA conoce a Prisma
 * - Esta clase traduce entre ambos modelos
 */
@Injectable()
export class PrismaVentaRepository implements IVentaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(venta: Venta): Promise<void> {
    const prismaData = VentaPersistenceMapper.toPrisma(venta);

    await this.prisma.venta.create({
      data: prismaData,
    });
  }

  async findById(id: UUID): Promise<Venta | null> {
    const prismaVenta = await this.prisma.venta.findUnique({
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
    const prismaVentas = await this.prisma.venta.findMany({
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

    await this.prisma.venta.update({
      where: { id: venta.getId().toString() },
      data: prismaData,
    });
  }
}
