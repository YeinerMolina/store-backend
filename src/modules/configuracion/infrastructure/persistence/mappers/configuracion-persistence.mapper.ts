import type {
  ParametroOperativoData,
  PoliticaData,
} from '@configuracion/domain';
import {
  isTipoDato,
  isTipoPolitica,
  isEstadoPolitica,
} from '@configuracion/domain';
import type {
  ParametroOperativo as PrismaParametroOperativo,
  Politica as PrismaPolitica,
} from '@prisma/client';

export class ConfiguracionPersistenceMapper {
  /**
   * Throw si BD tiene valores de enum corruptos.
   */
  static prismaToDomainParametroData(
    record: PrismaParametroOperativo,
  ): ParametroOperativoData {
    if (!isTipoDato(record.tipoDato)) {
      throw new Error(
        `BD corrupta: tipoDato inválido en registro ${record.id}: ${record.tipoDato}`,
      );
    }

    return {
      id: record.id,
      clave: record.clave,
      nombre: record.nombre,
      descripcion: record.descripcion ?? undefined,
      tipoDato: record.tipoDato,
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

  /**
   * Throw si BD tiene valores de tipo o estado corruptos.
   */
  static prismaToDomainPoliticaData(record: PrismaPolitica): PoliticaData {
    if (!isTipoPolitica(record.tipo)) {
      throw new Error(
        `BD corrupta: tipo inválido en política ${record.id}: ${record.tipo}`,
      );
    }

    if (!isEstadoPolitica(record.estado)) {
      throw new Error(
        `BD corrupta: estado inválido en política ${record.id}: ${record.estado}`,
      );
    }

    return {
      id: record.id,
      tipo: record.tipo,
      version: record.version,
      contenido: record.contenido,
      estado: record.estado,
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
