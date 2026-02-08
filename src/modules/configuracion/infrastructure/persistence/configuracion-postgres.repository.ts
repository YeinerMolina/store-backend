/**
 * PostgreSQL Repository Implementation - CONFIGURACIÓN Module
 *
 * Implements ConfiguracionRepository using Prisma ORM.
 * Handles persistence of ParametroOperativo and Politica aggregates.
 *
 * UPSERT strategy: Always use findOrCreate pattern to maintain domain invariants.
 * Transactional operations ensure consistency across related records.
 */

import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import {
  ConfiguracionRepository,
  ParametroOperativo,
  ParametroOperativoData,
  Politica,
  PoliticaData,
  TipoPoliticaEnum,
  EstadoPoliticaEnum,
} from '@configuracion/domain';
import { ConfiguracionPersistenceMapper } from './mappers/configuracion-persistence.mapper';

/**
 * Implements ConfiguracionRepository with Prisma.
 * All queries convert between domain and persistence models via mappers.
 */
@Injectable()
export class ConfiguracionPostgresRepository implements ConfiguracionRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Save ParametroOperativo (UPSERT pattern).
   * Update existing by ID, insert if not exists.
   *
   * Throws ConflictException if clave already exists (for creation only).
   * Side effect: Auditable via database triggers (if configured).
   */
  async guardarParametro(parametro: ParametroOperativo): Promise<void> {
    const data = ConfiguracionPersistenceMapper.domainDataToPrismaParametro({
      id: parametro.id,
      clave: parametro.clave,
      nombre: parametro.nombre,
      descripcion: parametro.descripcion,
      tipoDato: parametro.tipoDato,
      valor: parametro.valor,
      valorDefecto: parametro.valorDefecto,
      valorMinimo: parametro.valorMinimo,
      valorMaximo: parametro.valorMaximo,
      requiereReinicio: parametro.requiereReinicio,
      modificadoPorId: parametro.modificadoPorId,
      fechaModificacion: parametro.fechaModificacion,
    });

    try {
      await this.prisma.parametroOperativo.upsert({
        where: { id: parametro.id },
        create: data,
        update: data,
      });
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('clave')) {
        throw new ConflictException(
          `Parámetro con clave ${parametro.clave} ya existe`,
        );
      }
      throw error;
    }
  }

  async buscarParametroPorId(id: string): Promise<ParametroOperativo | null> {
    const record = await this.prisma.parametroOperativo.findUnique({
      where: { id },
    });

    if (!record) return null;

    const data =
      ConfiguracionPersistenceMapper.prismaToDomainParametroData(record);
    return ParametroOperativo.desde(data);
  }

  async buscarParametroPorClave(
    clave: string,
  ): Promise<ParametroOperativo | null> {
    const record = await this.prisma.parametroOperativo.findUnique({
      where: { clave },
    });

    if (!record) return null;

    const data =
      ConfiguracionPersistenceMapper.prismaToDomainParametroData(record);
    return ParametroOperativo.desde(data);
  }

  async listarParametros(): Promise<ParametroOperativo[]> {
    const records = await this.prisma.parametroOperativo.findMany();

    return records.map((record) => {
      const data =
        ConfiguracionPersistenceMapper.prismaToDomainParametroData(record);
      return ParametroOperativo.desde(data);
    });
  }

  /**
   * Save Politica (UPSERT pattern).
   * Update existing by ID, insert if not exists.
   *
   * Throws ConflictException if (tipo, version) tuple already exists (for creation only).
   * Side effect: Transactional if archiving previous policies.
   */
  async guardarPolitica(politica: Politica): Promise<void> {
    const data = ConfiguracionPersistenceMapper.domainDataToPrismaPolitica({
      id: politica.id,
      tipo: politica.tipo,
      version: politica.version,
      contenido: politica.contenido,
      estado: politica.estado,
      fechaVigenciaDesde: politica.fechaVigenciaDesde,
      fechaVigenciaHasta: politica.fechaVigenciaHasta,
      publicadoPorId: politica.publicadoPorId,
      fechaCreacion: politica.fechaCreacion,
    });

    try {
      await this.prisma.politica.upsert({
        where: { id: politica.id },
        create: data,
        update: data,
      });
    } catch (error: any) {
      if (
        error.code === 'P2002' &&
        error.meta?.target?.includes('tipo') &&
        error.meta?.target?.includes('version')
      ) {
        throw new ConflictException(
          `Política de tipo ${politica.tipo} versión ${politica.version} ya existe`,
        );
      }
      throw error;
    }
  }

  async buscarPoliticaPorId(id: string): Promise<Politica | null> {
    const record = await this.prisma.politica.findUnique({
      where: { id },
    });

    if (!record) return null;

    const data =
      ConfiguracionPersistenceMapper.prismaToDomainPoliticaData(record);
    return Politica.desde(data);
  }

  async buscarPoliticaVigente(
    tipo: TipoPoliticaEnum,
  ): Promise<Politica | null> {
    const record = await this.prisma.politica.findFirst({
      where: {
        tipo,
        estado: EstadoPoliticaEnum.VIGENTE,
      },
    });

    if (!record) return null;

    const data =
      ConfiguracionPersistenceMapper.prismaToDomainPoliticaData(record);
    return Politica.desde(data);
  }

  async listarPoliticas(tipo?: TipoPoliticaEnum): Promise<Politica[]> {
    const records = await this.prisma.politica.findMany({
      where: tipo ? { tipo } : undefined,
    });

    return records.map((record) => {
      const data =
        ConfiguracionPersistenceMapper.prismaToDomainPoliticaData(record);
      return Politica.desde(data);
    });
  }

  async buscarPoliticasVigentesPorTipo(
    tipo: TipoPoliticaEnum,
  ): Promise<Politica[]> {
    const records = await this.prisma.politica.findMany({
      where: {
        tipo,
        estado: EstadoPoliticaEnum.VIGENTE,
      },
    });

    return records.map((record) => {
      const data =
        ConfiguracionPersistenceMapper.prismaToDomainPoliticaData(record);
      return Politica.desde(data);
    });
  }
}
