import type {
  ConfiguracionRepository,
  ConfiguracionService,
  CrearParametroOperativoProps,
  ActualizarParametroOperativoProps,
  ParametroOperativoData,
  CrearPoliticaProps,
  PublicarPoliticaProps,
  PoliticaData,
  TipoPoliticaEnum,
} from '../../domain';
import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ParametroOperativo, Politica } from '../../domain';
import { CONFIGURACION_REPOSITORY_TOKEN } from '../../infrastructure/tokens';
import { ConfiguracionMapper } from '../mappers/configuracion.mapper';

@Injectable()
export class ConfiguracionApplicationService implements ConfiguracionService {
  constructor(
    @Inject(CONFIGURACION_REPOSITORY_TOKEN)
    private readonly repository: ConfiguracionRepository,
  ) {}

  /**
   * Throw ConflictException si la clave ya existe.
   */
  async crearParametroOperativo(
    params: CrearParametroOperativoProps,
  ): Promise<ParametroOperativoData> {
    const existing = await this.repository.buscarParametroPorClave(
      params.clave,
    );
    if (existing) {
      throw new ConflictException(
        `Parámetro con clave ${params.clave} ya existe`,
      );
    }

    const parametro = ParametroOperativo.crear(params);
    await this.repository.guardarParametro(parametro);

    return ConfiguracionMapper.parametroToData(parametro);
  }

  async actualizarParametroOperativo(
    id: string,
    params: ActualizarParametroOperativoProps,
  ): Promise<ParametroOperativoData> {
    const parametro = await this.repository.buscarParametroPorId(id);
    if (!parametro) {
      throw new NotFoundException(`Parámetro ${id} no encontrado`);
    }

    parametro.actualizar(params);
    await this.repository.guardarParametro(parametro);

    return ConfiguracionMapper.parametroToData(parametro);
  }

  async obtenerParametroOperativo(
    id: string,
  ): Promise<ParametroOperativoData | null> {
    const parametro = await this.repository.buscarParametroPorId(id);
    if (!parametro) return null;

    return ConfiguracionMapper.parametroToData(parametro);
  }

  async obtenerParametroPorClave(
    clave: string,
  ): Promise<ParametroOperativoData | null> {
    const parametro = await this.repository.buscarParametroPorClave(clave);
    if (!parametro) return null;

    return ConfiguracionMapper.parametroToData(parametro);
  }

  async listarParametros(): Promise<ParametroOperativoData[]> {
    const parametros = await this.repository.listarParametros();
    return parametros.map(ConfiguracionMapper.parametroToData);
  }

  /**
   * Throw ConflictException si (tipo, version) ya existe.
   */
  async crearPolitica(params: CrearPoliticaProps): Promise<PoliticaData> {
    const existing = await this.repository.listarPoliticas(params.tipo);
    if (
      existing.some(
        (p) => p.tipo === params.tipo && p.version === params.version,
      )
    ) {
      throw new ConflictException(
        `Política de tipo ${params.tipo} versión ${params.version} ya existe`,
      );
    }

    const politica = Politica.crear(params);
    await this.repository.guardarPolitica(politica);

    return ConfiguracionMapper.politicaToData(politica);
  }

  /**
   * Archiva automáticamente política VIGENTE anterior del mismo tipo.
   * Transaccional: si archivar falla, publicar también falla.
   */
  async publicarPolitica(
    politicaId: string,
    params: PublicarPoliticaProps,
  ): Promise<PoliticaData> {
    const politica = await this.repository.buscarPoliticaPorId(politicaId);
    if (!politica) {
      throw new NotFoundException(`Política ${politicaId} no encontrada`);
    }

    const anterior = await this.repository.buscarPoliticaVigente(politica.tipo);

    politica.publicar(params);

    if (anterior) {
      anterior.archivar();
      await this.repository.guardarPolitica(anterior);
    }

    await this.repository.guardarPolitica(politica);

    return ConfiguracionMapper.politicaToData(politica);
  }

  async obtenerPoliticaVigente(
    tipo: TipoPoliticaEnum,
  ): Promise<PoliticaData | null> {
    const politica = await this.repository.buscarPoliticaVigente(tipo);
    if (!politica) return null;

    return ConfiguracionMapper.politicaToData(politica);
  }

  async listarPoliticas(tipo?: TipoPoliticaEnum): Promise<PoliticaData[]> {
    const politicas = await this.repository.listarPoliticas(tipo);
    return politicas.map(ConfiguracionMapper.politicaToData);
  }
}
