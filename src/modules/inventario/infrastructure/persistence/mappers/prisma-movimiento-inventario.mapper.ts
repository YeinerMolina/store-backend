import type { MovimientoInventario as PrismaMovimientoInventario } from '@prisma/client';
import type { MovimientoInventarioData } from '../../../domain/aggregates/inventario/movimiento-inventario.types';
import {
  TipoMovimientoEnum,
  TipoOperacionEnum,
} from '../../../domain/aggregates/inventario/types';

export class PrismaMovimientoInventarioMapper {
  static toDomain(
    prismaData: PrismaMovimientoInventario,
  ): MovimientoInventarioData {
    return {
      id: prismaData.id,
      inventarioId: prismaData.inventarioId,
      tipoMovimiento: prismaData.tipoMovimiento as TipoMovimientoEnum,
      cantidad: prismaData.cantidad,
      cantidadAnterior: prismaData.cantidadAnterior,
      cantidadPosterior: prismaData.cantidadPosterior,
      tipoOperacionOrigen: prismaData.tipoOperacionOrigen
        ? (prismaData.tipoOperacionOrigen as TipoOperacionEnum)
        : undefined,
      operacionOrigenId: prismaData.operacionOrigenId || undefined,
      empleadoId: prismaData.empleadoId || undefined,
      intencion: prismaData.intencion || undefined,
      notas: prismaData.notas || undefined,
      fechaMovimiento: prismaData.fechaMovimiento,
    };
  }
}
