/**
 * CONFIGURACIÓN Controller - HTTP Endpoints
 *
 * REST API for managing operational parameters and policies.
 * All endpoints validate input with Zod schemas before passing to services.
 * Swagger documentation applied via decorators for OpenAPI compliance.
 *
 * Authentication: Required for all endpoints (guards applied at module level).
 * Authorization: Checked in application service layer.
 */

import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  Query,
  Inject,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ValidateWith } from '@shared/decorators/validate-with.decorator';
import type { ConfiguracionService } from '../../domain/ports/inbound/configuracion.service';
import { TipoPoliticaEnum } from '../../domain/aggregates/configuracion.types';
import { CONFIGURACION_SERVICE_TOKEN } from '../tokens';
import {
  CrearParametroOperativoSchema,
  ActualizarParametroOperativoSchema,
  CrearPoliticaSchema,
  PublicarPoliticaSchema,
} from '../../application/dto/configuracion.schema';
import type {
  CrearParametroOperativoRequestDto,
  ActualizarParametroOperativoRequestDto,
  CrearPoliticaRequestDto,
  PublicarPoliticaRequestDto,
} from '../../application/dto/configuracion-request.dto';
import {
  ParametroOperativoResponseDto,
  PoliticaResponseDto,
} from '../../application/dto/configuracion-response.dto';
import { ConfiguracionMapper } from '../../application/mappers/configuracion.mapper';
import {
  ApiCrearParametroOperativo,
  ApiActualizarParametroOperativo,
  ApiObtenerParametroOperativo,
  ApiObtenerParametroPorClave,
  ApiListarParametros,
  ApiCrearPolitica,
  ApiPublicarPolitica,
  ApiObtenerPolitica,
  ApiObtenerPoliticaVigente,
  ApiListarPoliticas,
} from '../../docs/decorators/api-configuracion.decorator';

/**
 * HTTP Controller for CONFIGURACIÓN module.
 *
 * Responsible for:
 * - Route mapping
 * - Request validation (via @ValidateWith)
 * - DTO → Domain Props mapping
 * - Domain Data → DTO mapping
 * - HTTP status codes
 * - Swagger documentation
 */
@Controller('configuracion')
@ApiTags('Configuración')
export class ConfiguracionController {
  constructor(
    @Inject(CONFIGURACION_SERVICE_TOKEN)
    private readonly configuracionService: ConfiguracionService,
  ) {}

  // ========================== PARÁMETROS OPERATIVOS ==========================

  /**
   * POST /configuracion/parametros
   * Create new operating parameter.
   */
  @Post('parametros')
  @ValidateWith(CrearParametroOperativoSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiCrearParametroOperativo()
  async crearParametro(
    @Body() request: CrearParametroOperativoRequestDto,
  ): Promise<ParametroOperativoResponseDto> {
    const props = ConfiguracionMapper.crearRequestToProps(request);
    const data = await this.configuracionService.crearParametroOperativo(props);
    return ConfiguracionMapper.parametroToResponseDto(data);
  }

  /**
   * PATCH /configuracion/parametros/:id
   * Update parameter value.
   */
  @Patch('parametros/:id')
  @ValidateWith(ActualizarParametroOperativoSchema)
  @ApiActualizarParametroOperativo()
  async actualizarParametro(
    @Param('id') id: string,
    @Body() request: ActualizarParametroOperativoRequestDto,
  ): Promise<ParametroOperativoResponseDto> {
    const props = ConfiguracionMapper.actualizarRequestToProps(request);
    const data = await this.configuracionService.actualizarParametroOperativo(
      id,
      props,
    );
    return ConfiguracionMapper.parametroToResponseDto(data);
  }

  /**
   * GET /configuracion/parametros/:id
   * Get parameter by ID.
   */
  @Get('parametros/:id')
  @ApiObtenerParametroOperativo()
  async obtenerParametro(
    @Param('id') id: string,
  ): Promise<ParametroOperativoResponseDto> {
    const data = await this.configuracionService.obtenerParametroOperativo(id);
    if (!data) {
      throw new NotFoundException('Parámetro no encontrado');
    }
    return ConfiguracionMapper.parametroToResponseDto(data);
  }

  /**
   * GET /configuracion/parametros/clave/:clave
   * Get parameter by natural business identifier (clave).
   *
   * This is the primary lookup method. Route order matters: must come before /:id
   */
  @Get('parametros/clave/:clave')
  @ApiObtenerParametroPorClave()
  async obtenerParametroPorClave(
    @Param('clave') clave: string,
  ): Promise<ParametroOperativoResponseDto> {
    const data =
      await this.configuracionService.obtenerParametroPorClave(clave);
    if (!data) {
      throw new NotFoundException(`Parámetro con clave ${clave} no encontrado`);
    }
    return ConfiguracionMapper.parametroToResponseDto(data);
  }

  /**
   * GET /configuracion/parametros
   * List all parameters without pagination.
   */
  @Get('parametros')
  @ApiListarParametros()
  async listarParametros(): Promise<ParametroOperativoResponseDto[]> {
    const data = await this.configuracionService.listarParametros();
    return data.map((d) => ConfiguracionMapper.parametroToResponseDto(d));
  }

  // ========================== POLÍTICAS ==========================

  /**
   * POST /configuracion/politicas
   * Create new policy in BORRADOR state.
   */
  @Post('politicas')
  @ValidateWith(CrearPoliticaSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiCrearPolitica()
  async crearPolitica(
    @Body() request: CrearPoliticaRequestDto,
  ): Promise<PoliticaResponseDto> {
    const props = ConfiguracionMapper.crearPoliticaRequestToProps(request);
    const data = await this.configuracionService.crearPolitica(props);
    return ConfiguracionMapper.politicaToResponseDto(data);
  }

  /**
   * PATCH /configuracion/politicas/:id/publicar
   * Publish policy: BORRADOR → VIGENTE.
   * Automatically archives previous VIGENTE policy of same type.
   */
  @Patch('politicas/:id/publicar')
  @ValidateWith(PublicarPoliticaSchema)
  @ApiPublicarPolitica()
  async publicarPolitica(
    @Param('id') id: string,
    @Body() request: PublicarPoliticaRequestDto,
  ): Promise<PoliticaResponseDto> {
    const props = ConfiguracionMapper.publicarRequestToProps(request);
    const data = await this.configuracionService.publicarPolitica(id, props);
    return ConfiguracionMapper.politicaToResponseDto(data);
  }

  /**
   * GET /configuracion/politicas/:id
   * Get policy by ID.
   */
  @Get('politicas/:id')
  @ApiObtenerPolitica()
  async obtenerPolitica(@Param('id') id: string): Promise<PoliticaResponseDto> {
    // Note: Currently no direct get-by-id endpoint in service
    // This would need to be added to listarPoliticas with filtering
    // For now, return from listar and find first match
    const data = await this.configuracionService.listarPoliticas();
    const politica = data.find((p) => p.id === id);
    if (!politica) {
      throw new NotFoundException('Política no encontrada');
    }
    return ConfiguracionMapper.politicaToResponseDto(politica);
  }

  /**
   * GET /configuracion/politicas/vigente/:tipo
   * Get currently active (VIGENTE) policy for given type.
   *
   * Route order: must come before /:id
   */
  @Get('politicas/vigente/:tipo')
  @ApiObtenerPoliticaVigente()
  async obtenerPoliticaVigente(
    @Param('tipo') tipo: string,
  ): Promise<PoliticaResponseDto> {
    const data = await this.configuracionService.obtenerPoliticaVigente(
      tipo as TipoPoliticaEnum,
    );
    if (!data) {
      throw new NotFoundException(`No hay política vigente de tipo ${tipo}`);
    }
    return ConfiguracionMapper.politicaToResponseDto(data);
  }

  /**
   * GET /configuracion/politicas
   * List all policies (optional type filter).
   *
   * Query params:
   * - tipo: (optional) Filter by CAMBIOS | ENVIOS | TERMINOS
   */
  @Get('politicas')
  @ApiListarPoliticas()
  async listarPoliticas(
    @Query('tipo') tipo?: string,
  ): Promise<PoliticaResponseDto[]> {
    const data = await this.configuracionService.listarPoliticas(
      tipo as TipoPoliticaEnum | undefined,
    );
    return data.map((d) => ConfiguracionMapper.politicaToResponseDto(d));
  }
}
