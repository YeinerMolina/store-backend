/**
 * Persistence Mapper: Transforms between domain entities and database models.
 *
 * Domain Entity → Prisma: Serialize aggregates for persistence.
 * Prisma → Domain Data: Hydrate entities from database records.
 *
 * Note: This differs from application mapper (domain ↔ HTTP).
 * Here we handle database serialization concerns.
 */

import type {
  ParametroOperativoData,
  PoliticaData,
} from '@configuracion/domain';
import {
  TipoDatoEnum,
  TipoPoliticaEnum,
  EstadoPoliticaEnum,
} from '@configuracion/domain';
import type {
  ParametroOperativo as PrismaParametroOperativo,
  Politica as PrismaPolitica,
} from '@prisma/client';

/**
 * Persistence mapper for CONFIGURACIÓN aggregates.
 * Handles bidirectional transformation with Prisma models.
 */
export class ConfiguracionPersistenceMapper {
  /**
   * Prisma ParametroOperativo → Domain Data.
   * Converts database record to domain data for hydration.
   */
  static prismaToDomainParametroData(
    record: PrismaParametroOperativo,
  ): ParametroOperativoData {
    return {
      id: record.id,
      clave: record.clave,
      nombre: record.nombre,
      descripcion: record.descripcion ?? undefined,
      tipoDato: record.tipoDato as any,
      valor: record.valor,
      valorDefecto: record.valorDefecto,
      valorMinimo: record.valorMinimo ?? undefined,
      valorMaximo: record.valorMaximo ?? undefined,
      requiereReinicio: record.requiereReinicio,
      modificadoPorId: record.modificadoPor ?? undefined,
      fechaModificacion: record.fechaModificacion,
    };
  }

  /**
   * Domain ParametroOperativoData → Prisma insert/update object.
   * Converts domain data to format expected by create/update operations.
   */
  static domainDataToPrismaParametro(data: ParametroOperativoData) {
    return {
      id: data.id,
      clave: data.clave,
      nombre: data.nombre,
      descripcion: data.descripcion,
      tipoDato: data.tipoDato,
      valor: data.valor,
      valorDefecto: data.valorDefecto,
      valorMinimo: data.valorMinimo,
      valorMaximo: data.valorMaximo,
      requiereReinicio: data.requiereReinicio,
      modificadoPorId: data.modificadoPorId,
      fechaModificacion: data.fechaModificacion,
    };
  }

  /**
   * Prisma Politica → Domain Data.
   * Converts database record to domain data for hydration.
   */
  static prismaToDomainPoliticaData(record: PrismaPolitica): PoliticaData {
    return {
      id: record.id,
      tipo: record.tipo as any,
      version: record.version,
      contenido: record.contenido,
      estado: record.estado as any,
      fechaVigenciaDesde: record.fechaVigenciaDesde ?? undefined,
      fechaVigenciaHasta: record.fechaVigenciaHasta ?? undefined,
      publicadoPorId: record.publicadoPor ?? undefined,
      fechaCreacion: record.fechaCreacion,
    };
  }

  /**
   * Domain PoliticaData → Prisma insert/update object.
   * Converts domain data to format expected by create/update operations.
   */
  static domainDataToPrismaPolitica(data: PoliticaData) {
    return {
      id: data.id,
      tipo: data.tipo,
      version: data.version,
      contenido: data.contenido,
      estado: data.estado,
      fechaVigenciaDesde: data.fechaVigenciaDesde,
      fechaVigenciaHasta: data.fechaVigenciaHasta,
      publicadoPorId: data.publicadoPorId,
      fechaCreacion: data.fechaCreacion,
    };
  }
}
