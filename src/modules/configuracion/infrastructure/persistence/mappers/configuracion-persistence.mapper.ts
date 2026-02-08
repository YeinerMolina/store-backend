import type {
  ParametroOperativoData,
  PoliticaData,
  TipoDatoEnum,
  TipoPoliticaEnum,
  EstadoPoliticaEnum,
} from '@configuracion/domain';
import type {
  ParametroOperativo as PrismaParametroOperativo,
  Politica as PrismaPolitica,
} from '@prisma/client';

export class ConfiguracionPersistenceMapper {
  static prismaToDomainParametroData(
    record: PrismaParametroOperativo,
  ): ParametroOperativoData {
    return {
      id: record.id,
      clave: record.clave,
      nombre: record.nombre,
      descripcion: record.descripcion ?? undefined,
      tipoDato: record.tipoDato as TipoDatoEnum,
      valor: record.valor,
      valorDefecto: record.valorDefecto,
      valorMinimo: record.valorMinimo ?? undefined,
      valorMaximo: record.valorMaximo ?? undefined,
      requiereReinicio: record.requiereReinicio,
      modificadoPorId: record.modificadoPor ?? undefined,
      fechaModificacion: record.fechaModificacion,
    };
  }

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

  static prismaToDomainPoliticaData(record: PrismaPolitica): PoliticaData {
    return {
      id: record.id,
      tipo: record.tipo as TipoPoliticaEnum,
      version: record.version,
      contenido: record.contenido,
      estado: record.estado as EstadoPoliticaEnum,
      fechaVigenciaDesde: record.fechaVigenciaDesde ?? undefined,
      fechaVigenciaHasta: record.fechaVigenciaHasta ?? undefined,
      publicadoPorId: record.publicadoPor ?? undefined,
      fechaCreacion: record.fechaCreacion,
    };
  }

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
