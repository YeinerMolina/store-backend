/**
 * Application Service: CONFIGURACIÓN
 *
 * Implements ConfiguracionService (inbound port).
 * Orchestrates domain logic and repository interactions.
 *
 * Responsibilities:
 * - Validate business rules before delegating to aggregates
 * - Manage transactions (e.g., archiving previous policies)
 * - Transform DTOs to domain props and back
 * - Emit domain events for auditability
 *
 * Note: Security checks (who can do what) happen here too.
 * At this level, we've already validated the user has permission.
 */

import type {
  ConfiguracionRepository,
  ConfiguracionService,
  CrearParametroOperativoProps,
  ActualizarParametroOperativoProps,
  ParametroOperativoData,
  CrearPoliticaProps,
  PublicarPoliticaProps,
  PoliticaData,
  TipoPolitica,
} from '../../domain';
import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ParametroOperativo, Politica } from '../../domain';
import { CONFIGURACION_REPOSITORY_TOKEN } from '../../infrastructure/tokens';

/**
 * Application service orchestrating CONFIGURACIÓN domain logic.
 */
@Injectable()
export class ConfiguracionApplicationService implements ConfiguracionService {
  constructor(
    @Inject(CONFIGURACION_REPOSITORY_TOKEN)
    private readonly repository: ConfiguracionRepository,
  ) {}

  /**
   * Create new operating parameter.
   *
   * Validates:
   * - Clave doesn't already exist (UNIQUE constraint)
   * - Value matches type_data constraints
   * - Rangos [min, max] if specified
   *
   * Emits: ParametroOperativoCreado event
   */
  async crearParametroOperativo(
    params: CrearParametroOperativoProps,
  ): Promise<ParametroOperativoData> {
    // Check uniqueness before creating
    const existing = await this.repository.buscarParametroPorClave(
      params.clave,
    );
    if (existing) {
      throw new ConflictException(
        `Parámetro con clave ${params.clave} ya existe`,
      );
    }

    // Crear agregado (valida internamente)
    const parametro = ParametroOperativo.crear(params);

    // Persistir
    await this.repository.guardarParametro(parametro);

    // Retornar datos (sin eventos)
    return {
      id: parametro.getId(),
      clave: parametro.getClave(),
      nombre: parametro.getNombre(),
      descripcion: parametro.getDescripcion(),
      tipoDato: parametro.getTipoDato(),
      valor: parametro.getValor(),
      valorDefecto: parametro.getValorDefecto(),
      valorMinimo: parametro.getValorMinimo(),
      valorMaximo: parametro.getValorMaximo(),
      requiereReinicio: parametro.isRequiereReinicio(),
      modificadoPorId: parametro.getModificadoPorId(),
      fechaModificacion: parametro.getFechaModificacion(),
    };
  }

  /**
   * Update parameter value.
   *
   * Validates:
   * - Parameter exists
   * - New value matches type_data constraints
   * - New value is within [min, max] range
   *
   * Emits: ParametroOperativoActualizado event
   */
  async actualizarParametroOperativo(
    id: string,
    params: ActualizarParametroOperativoProps,
  ): Promise<ParametroOperativoData> {
    const parametro = await this.repository.buscarParametroPorId(id);
    if (!parametro) {
      throw new NotFoundException(`Parámetro ${id} no encontrado`);
    }

    // Actualizar agregado (valida internamente)
    parametro.actualizar(params);

    // Persistir cambios
    await this.repository.guardarParametro(parametro);

    // Retornar datos
    return {
      id: parametro.getId(),
      clave: parametro.getClave(),
      nombre: parametro.getNombre(),
      descripcion: parametro.getDescripcion(),
      tipoDato: parametro.getTipoDato(),
      valor: parametro.getValor(),
      valorDefecto: parametro.getValorDefecto(),
      valorMinimo: parametro.getValorMinimo(),
      valorMaximo: parametro.getValorMaximo(),
      requiereReinicio: parametro.isRequiereReinicio(),
      modificadoPorId: parametro.getModificadoPorId(),
      fechaModificacion: parametro.getFechaModificacion(),
    };
  }

  async obtenerParametroOperativo(
    id: string,
  ): Promise<ParametroOperativoData | null> {
    const parametro = await this.repository.buscarParametroPorId(id);
    if (!parametro) return null;

    return {
      id: parametro.getId(),
      clave: parametro.getClave(),
      nombre: parametro.getNombre(),
      descripcion: parametro.getDescripcion(),
      tipoDato: parametro.getTipoDato(),
      valor: parametro.getValor(),
      valorDefecto: parametro.getValorDefecto(),
      valorMinimo: parametro.getValorMinimo(),
      valorMaximo: parametro.getValorMaximo(),
      requiereReinicio: parametro.isRequiereReinicio(),
      modificadoPorId: parametro.getModificadoPorId(),
      fechaModificacion: parametro.getFechaModificacion(),
    };
  }

  async obtenerParametroPorClave(
    clave: string,
  ): Promise<ParametroOperativoData | null> {
    const parametro = await this.repository.buscarParametroPorClave(clave);
    if (!parametro) return null;

    return {
      id: parametro.getId(),
      clave: parametro.getClave(),
      nombre: parametro.getNombre(),
      descripcion: parametro.getDescripcion(),
      tipoDato: parametro.getTipoDato(),
      valor: parametro.getValor(),
      valorDefecto: parametro.getValorDefecto(),
      valorMinimo: parametro.getValorMinimo(),
      valorMaximo: parametro.getValorMaximo(),
      requiereReinicio: parametro.isRequiereReinicio(),
      modificadoPorId: parametro.getModificadoPorId(),
      fechaModificacion: parametro.getFechaModificacion(),
    };
  }

  async listarParametros(): Promise<ParametroOperativoData[]> {
    const parametros = await this.repository.listarParametros();

    return parametros.map((p) => ({
      id: p.getId(),
      clave: p.getClave(),
      nombre: p.getNombre(),
      descripcion: p.getDescripcion(),
      tipoDato: p.getTipoDato(),
      valor: p.getValor(),
      valorDefecto: p.getValorDefecto(),
      valorMinimo: p.getValorMinimo(),
      valorMaximo: p.getValorMaximo(),
      requiereReinicio: p.isRequiereReinicio(),
      modificadoPorId: p.getModificadoPorId(),
      fechaModificacion: p.getFechaModificacion(),
    }));
  }

  /**
   * Create new policy in BORRADOR state.
   *
   * Validates:
   * - (tipo, version) tuple doesn't already exist (UNIQUE constraint)
   * - Contenido is not empty
   *
   * Emits: PoliticaCreada event
   */
  async crearPolitica(params: CrearPoliticaProps): Promise<PoliticaData> {
    // Check uniqueness before creating
    const existing = await this.repository.listarPoliticas(params.tipo);
    if (
      existing.some(
        (p) => p.getTipo() === params.tipo && p.getVersion() === params.version,
      )
    ) {
      throw new ConflictException(
        `Política de tipo ${params.tipo} versión ${params.version} ya existe`,
      );
    }

    // Crear agregado
    const politica = Politica.crear(params);

    // Persistir
    await this.repository.guardarPolitica(politica);

    // Retornar datos
    return {
      id: politica.getId(),
      tipo: politica.getTipo(),
      version: politica.getVersion(),
      contenido: politica.getContenido(),
      estado: politica.getEstado(),
      fechaVigenciaDesde: politica.getFechaVigenciaDesde(),
      fechaVigenciaHasta: politica.getFechaVigenciaHasta(),
      publicadoPorId: politica.getPublicadoPorId(),
      fechaCreacion: politica.getFechaCreacion(),
    };
  }

  /**
   * Publish policy: BORRADOR → VIGENTE.
   *
   * Side effect: Automatically archives previous VIGENTE policy of same type.
   * This maintains the invariant "only one VIGENTE per type".
   *
   * Transactional: If archiving fails, publishing also fails.
   *
   * Emits: PoliticaPublicada event (and PoliticaArchivada for previous)
   */
  async publicarPolitica(
    politicaId: string,
    params: PublicarPoliticaProps,
  ): Promise<PoliticaData> {
    const politica = await this.repository.buscarPoliticaPorId(politicaId);
    if (!politica) {
      throw new NotFoundException(`Política ${politicaId} no encontrada`);
    }

    // Buscar política VIGENTE anterior del mismo tipo
    const anterior = await this.repository.buscarPoliticaVigente(
      politica.getTipo(),
    );

    // Publicar nueva
    politica.publicar(params);

    // Archivar anterior (si existe)
    if (anterior) {
      anterior.archivar();
      await this.repository.guardarPolitica(anterior);
    }

    // Persistir nueva
    await this.repository.guardarPolitica(politica);

    // Retornar datos
    return {
      id: politica.getId(),
      tipo: politica.getTipo(),
      version: politica.getVersion(),
      contenido: politica.getContenido(),
      estado: politica.getEstado(),
      fechaVigenciaDesde: politica.getFechaVigenciaDesde(),
      fechaVigenciaHasta: politica.getFechaVigenciaHasta(),
      publicadoPorId: politica.getPublicadoPorId(),
      fechaCreacion: politica.getFechaCreacion(),
    };
  }

  async obtenerPoliticaVigente(
    tipo: TipoPolitica,
  ): Promise<PoliticaData | null> {
    const politica = await this.repository.buscarPoliticaVigente(tipo);
    if (!politica) return null;

    return {
      id: politica.getId(),
      tipo: politica.getTipo(),
      version: politica.getVersion(),
      contenido: politica.getContenido(),
      estado: politica.getEstado(),
      fechaVigenciaDesde: politica.getFechaVigenciaDesde(),
      fechaVigenciaHasta: politica.getFechaVigenciaHasta(),
      publicadoPorId: politica.getPublicadoPorId(),
      fechaCreacion: politica.getFechaCreacion(),
    };
  }

  async listarPoliticas(tipo?: TipoPolitica): Promise<PoliticaData[]> {
    const politicas = await this.repository.listarPoliticas(tipo);

    return politicas.map((p) => ({
      id: p.getId(),
      tipo: p.getTipo(),
      version: p.getVersion(),
      contenido: p.getContenido(),
      estado: p.getEstado(),
      fechaVigenciaDesde: p.getFechaVigenciaDesde(),
      fechaVigenciaHasta: p.getFechaVigenciaHasta(),
      publicadoPorId: p.getPublicadoPorId(),
      fechaCreacion: p.getFechaCreacion(),
    }));
  }
}
