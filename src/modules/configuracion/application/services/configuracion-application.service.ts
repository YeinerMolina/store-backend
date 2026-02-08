import type {
  ConfiguracionRepository,
  ConfiguracionService,
  CrearParametroOperativoProps,
  ActualizarParametroOperativoProps,
  CrearPoliticaProps,
  PublicarPoliticaProps,
  TipoPoliticaEnum,
} from '../../domain';
import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ParametroOperativo, Politica } from '../../domain';
import {
  ParametroOperativoFactory,
  PoliticaFactory,
} from '../../domain/factories';
import { CONFIGURACION_REPOSITORY_TOKEN } from '../../domain/ports/tokens';

@Injectable()
export class ConfiguracionApplicationService implements ConfiguracionService {
  constructor(
    @Inject(CONFIGURACION_REPOSITORY_TOKEN)
    private readonly repository: ConfiguracionRepository,
  ) {}

  async crearParametroOperativo(
    params: CrearParametroOperativoProps,
  ): Promise<ParametroOperativo> {
    const existing = await this.repository.buscarParametroPorClave(
      params.clave,
    );
    if (existing) {
      throw new ConflictException(
        `Parámetro con clave ${params.clave} ya existe`,
      );
    }

    const parametro = ParametroOperativoFactory.crear(params);
    await this.repository.guardarParametro(parametro);

    return parametro;
  }

  async actualizarParametroOperativo(
    id: string,
    params: ActualizarParametroOperativoProps,
  ): Promise<ParametroOperativo> {
    const parametro = await this.repository.buscarParametroPorId(id);
    if (!parametro) {
      throw new NotFoundException(`Parámetro ${id} no encontrado`);
    }

    parametro.actualizar(params);
    await this.repository.guardarParametro(parametro);

    return parametro;
  }

  async obtenerParametroOperativo(
    id: string,
  ): Promise<ParametroOperativo | null> {
    return this.repository.buscarParametroPorId(id);
  }

  async obtenerParametroPorClave(
    clave: string,
  ): Promise<ParametroOperativo | null> {
    return this.repository.buscarParametroPorClave(clave);
  }

  async listarParametros(): Promise<ParametroOperativo[]> {
    return this.repository.listarParametros();
  }

  async crearPolitica(params: CrearPoliticaProps): Promise<Politica> {
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

    const politica = PoliticaFactory.crear(params);
    await this.repository.guardarPolitica(politica);

    return politica;
  }

  async publicarPolitica(
    politicaId: string,
    params: PublicarPoliticaProps,
  ): Promise<Politica> {
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

    return politica;
  }

  async obtenerPoliticaVigente(
    tipo: TipoPoliticaEnum,
  ): Promise<Politica | null> {
    return this.repository.buscarPoliticaVigente(tipo);
  }

  async listarPoliticas(tipo?: TipoPoliticaEnum): Promise<Politica[]> {
    return this.repository.listarPoliticas(tipo);
  }
}
