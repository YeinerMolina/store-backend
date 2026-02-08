import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import {
  ConfiguracionRepository,
  ParametroOperativo,
  Politica,
  TipoPoliticaEnum,
  EstadoPoliticaEnum,
} from '@configuracion/domain';
import { ConfiguracionPersistenceMapper } from './mappers/configuracion-persistence.mapper';

@Injectable()
export class ConfiguracionPostgresRepository implements ConfiguracionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async guardarParametro(parametro: ParametroOperativo): Promise<void> {
    const data =
      ConfiguracionPersistenceMapper.domainDataToPrismaParametro(parametro);

    await this.prisma.parametroOperativo.upsert({
      where: { id: parametro.id },
      create: data,
      update: data,
    });
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

  async guardarPolitica(politica: Politica): Promise<void> {
    const data =
      ConfiguracionPersistenceMapper.domainDataToPrismaPolitica(politica);

    await this.prisma.politica.upsert({
      where: { id: politica.id },
      create: data,
      update: data,
    });
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
