import { Inventario } from '../../../domain/aggregates/inventario/inventario.entity';
import type { Inventario as PrismaInventario } from '@prisma/client';
import { TipoItemEnum } from '../../../domain/aggregates/inventario/types';
import type { InventarioData } from '../../../domain/aggregates/inventario/inventario.types';

export class PrismaInventarioMapper {
  static toPersistence(inventario: Inventario) {
    return {
      id: inventario.id,
      tipoItem: inventario.tipoItem,
      itemId: inventario.itemId,
      ubicacion: inventario.ubicacion || null,
      cantidadDisponible: inventario.cantidadDisponible.obtenerValor(),
      cantidadReservada: inventario.cantidadReservada.obtenerValor(),
      cantidadAbandono: inventario.cantidadAbandono.obtenerValor(),
      version: inventario.version.obtenerNumero(),
      fechaActualizacion: inventario.fechaActualizacion,
    };
  }

  static toDomain(prismaData: PrismaInventario): InventarioData {
    return {
      id: prismaData.id,
      tipoItem: prismaData.tipoItem as TipoItemEnum,
      itemId: prismaData.itemId,
      ubicacion: prismaData.ubicacion ?? undefined,
      cantidadDisponible: prismaData.cantidadDisponible,
      cantidadReservada: prismaData.cantidadReservada,
      cantidadAbandono: prismaData.cantidadAbandono,
      version: prismaData.version,
      fechaActualizacion: prismaData.fechaActualizacion,
    };
  }
}
