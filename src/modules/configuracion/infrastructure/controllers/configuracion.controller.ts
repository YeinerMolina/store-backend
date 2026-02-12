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
import { CONFIGURACION_SERVICE_TOKEN } from '../../domain/ports/tokens';
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
} from '../../application/dto';
import {
  ParametroOperativoResponseDto,
  PoliticaResponseDto,
} from '../../application/dto/configuracion-response.dto';
import { ConfiguracionRequestMapper } from '../../application/mappers/configuracion-request.mapper';
import { ConfiguracionResponseMapper } from '../../application/mappers/configuracion-response.mapper';
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

@Controller('configuracion')
@ApiTags('Configuración')
export class ConfiguracionController {
  constructor(
    @Inject(CONFIGURACION_SERVICE_TOKEN)
    private readonly configuracionService: ConfiguracionService,
  ) {}

  @Post('parametros')
  @ValidateWith(CrearParametroOperativoSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiCrearParametroOperativo()
  async crearParametro(
    @Body() request: CrearParametroOperativoRequestDto,
  ): Promise<ParametroOperativoResponseDto> {
    const props = ConfiguracionRequestMapper.toCrearParametroProps(request);
    const parametro =
      await this.configuracionService.crearParametroOperativo(props);
    return ConfiguracionResponseMapper.toParametroResponseDto(parametro);
  }

  @Patch('parametros/:id')
  @ValidateWith(ActualizarParametroOperativoSchema)
  @ApiActualizarParametroOperativo()
  async actualizarParametro(
    @Param('id') id: string,
    @Body() request: ActualizarParametroOperativoRequestDto,
  ): Promise<ParametroOperativoResponseDto> {
    const props = ConfiguracionRequestMapper.toActualizarParametroProps(
      request,
      '-1',
    );
    const parametro =
      await this.configuracionService.actualizarParametroOperativo(id, props);
    return ConfiguracionResponseMapper.toParametroResponseDto(parametro);
  }

  @Get('parametros/:id')
  @ApiObtenerParametroOperativo()
  async obtenerParametro(
    @Param('id') id: string,
  ): Promise<ParametroOperativoResponseDto> {
    const parametro =
      await this.configuracionService.obtenerParametroOperativo(id);
    if (!parametro) {
      throw new NotFoundException('Parámetro no encontrado');
    }
    return ConfiguracionResponseMapper.toParametroResponseDto(parametro);
  }

  @Get('parametros/clave/:clave')
  @ApiObtenerParametroPorClave()
  async obtenerParametroPorClave(
    @Param('clave') clave: string,
  ): Promise<ParametroOperativoResponseDto> {
    const parametro =
      await this.configuracionService.obtenerParametroPorClave(clave);
    if (!parametro) {
      throw new NotFoundException(`Parámetro con clave ${clave} no encontrado`);
    }
    return ConfiguracionResponseMapper.toParametroResponseDto(parametro);
  }

  @Get('parametros')
  @ApiListarParametros()
  async listarParametros(): Promise<ParametroOperativoResponseDto[]> {
    const parametros = await this.configuracionService.listarParametros();
    return parametros.map((p) =>
      ConfiguracionResponseMapper.toParametroResponseDto(p),
    );
  }

  @Post('politicas')
  @ValidateWith(CrearPoliticaSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiCrearPolitica()
  async crearPolitica(
    @Body() request: CrearPoliticaRequestDto,
  ): Promise<PoliticaResponseDto> {
    const props = ConfiguracionRequestMapper.toCrearPoliticaProps(
      request,
      '-1',
    );
    const politica = await this.configuracionService.crearPolitica(props);
    return ConfiguracionResponseMapper.toPoliticaResponseDto(politica);
  }

  @Patch('politicas/:id/publicar')
  @ValidateWith(PublicarPoliticaSchema)
  @ApiPublicarPolitica()
  async publicarPolitica(
    @Param('id') id: string,
    @Body() request: PublicarPoliticaRequestDto,
  ): Promise<PoliticaResponseDto> {
    const props = ConfiguracionRequestMapper.toPublicarPoliticaProps(
      request,
      '-1',
    );
    const politica = await this.configuracionService.publicarPolitica(
      id,
      props,
    );
    return ConfiguracionResponseMapper.toPoliticaResponseDto(politica);
  }

  @Get('politicas/:id')
  @ApiObtenerPolitica()
  async obtenerPolitica(@Param('id') id: string): Promise<PoliticaResponseDto> {
    const politicas = await this.configuracionService.listarPoliticas();
    const politica = politicas.find((p) => p.id === id);
    if (!politica) {
      throw new NotFoundException('Política no encontrada');
    }
    return ConfiguracionResponseMapper.toPoliticaResponseDto(politica);
  }

  @Get('politicas/vigente/:tipo')
  @ApiObtenerPoliticaVigente()
  async obtenerPoliticaVigente(
    @Param('tipo') tipo: string,
  ): Promise<PoliticaResponseDto> {
    const politica = await this.configuracionService.obtenerPoliticaVigente(
      tipo as TipoPoliticaEnum,
    );
    if (!politica) {
      throw new NotFoundException(`No hay política vigente de tipo ${tipo}`);
    }
    return ConfiguracionResponseMapper.toPoliticaResponseDto(politica);
  }

  @Get('politicas')
  @ApiListarPoliticas()
  async listarPoliticas(
    @Query('tipo') tipo?: string,
  ): Promise<PoliticaResponseDto[]> {
    const politicas = await this.configuracionService.listarPoliticas(
      tipo as TipoPoliticaEnum | undefined,
    );
    return politicas.map((p) =>
      ConfiguracionResponseMapper.toPoliticaResponseDto(p),
    );
  }
}
