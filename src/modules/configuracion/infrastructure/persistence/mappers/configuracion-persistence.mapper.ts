import type { ParametroOperativoData } from '@configuracion/domain/aggregates/parametro-operativo/parametro-operativo.types';
import type { PoliticaData } from '@configuracion/domain/aggregates/politica/politica.types';
import type {
  ParametroOperativo as PrismaParametroOperativo,
  Politica as PrismaPolitica,
} from '@prisma/client';

export class ConfiguracionPersistenceMapper {
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

  static domainDataToPrismaParametro(data: ParametroOperativoData) {
    return {
      ...data,
      modificadoPor: data.modificadoPorId,
    };
  }

  static prismaToDomainPoliticaData(record: PrismaPolitica): PoliticaData {
    return {
      ...record,
      fechaVigenciaDesde: record.fechaVigenciaDesde ?? undefined,
      fechaVigenciaHasta: record.fechaVigenciaHasta ?? undefined,
      publicadoPorId: record.publicadoPor ?? undefined,
    } as PoliticaData;
  }

  static domainDataToPrismaPolitica(data: PoliticaData) {
    return {
      ...data,
      publicadoPor: data.publicadoPorId,
    };
  }
}
