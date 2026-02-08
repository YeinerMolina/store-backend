import type {
  ParametroOperativoData,
  PoliticaData,
} from '@configuracion/domain';
import type {
  ParametroOperativo as PrismaParametroOperativo,
  Politica as PrismaPolitica,
} from '@prisma/client';

/**
 * Transformaciones mínimas entre modelos Prisma y Domain.
 *
 * WHY usar spread operator:
 * - Reduce duplicación (copia automática de campos)
 * - Error-proof: nuevos campos se copian sin actualizar mapper
 * - Hace obvias las únicas transformaciones reales: null → undefined y field renaming
 */
export class ConfiguracionPersistenceMapper {
  /**
   * Prisma retorna null para campos opcionales, dominio espera undefined.
   * Campo modificadoPor (BD) → modificadoPorId (dominio).
   */
  static prismaToDomainParametroData(
    record: PrismaParametroOperativo,
  ): ParametroOperativoData {
    return {
      ...record,
      descripcion: record.descripcion ?? undefined,
      valorMinimo: record.valorMinimo ?? undefined,
      valorMaximo: record.valorMaximo ?? undefined,
      modificadoPorId: record.modificadoPor ?? undefined,
    } as ParametroOperativoData;
  }

  /**
   * Dirección inversa: dominio → Prisma.
   * Campo modificadoPorId (dominio) → modificadoPor (BD).
   */
  static domainDataToPrismaParametro(data: ParametroOperativoData) {
    return {
      ...data,
      modificadoPor: data.modificadoPorId,
    };
  }

  /**
   * Prisma null → dominio undefined para campos opcionales.
   * Campo publicadoPor (BD) → publicadoPorId (dominio).
   */
  static prismaToDomainPoliticaData(record: PrismaPolitica): PoliticaData {
    return {
      ...record,
      fechaVigenciaDesde: record.fechaVigenciaDesde ?? undefined,
      fechaVigenciaHasta: record.fechaVigenciaHasta ?? undefined,
      publicadoPorId: record.publicadoPor ?? undefined,
    } as PoliticaData;
  }

  /**
   * Dirección inversa: dominio → Prisma.
   * Campo publicadoPorId (dominio) → publicadoPor (BD).
   */
  static domainDataToPrismaPolitica(data: PoliticaData) {
    return {
      ...data,
      publicadoPor: data.publicadoPorId,
    };
  }
}
