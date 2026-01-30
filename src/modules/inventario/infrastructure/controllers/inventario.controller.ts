import {
  Controller,
  Post,
  Patch,
  Get,
  Delete,
  Body,
  Param,
  Query,
  Inject,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ValidateWith } from '../../../../shared/decorators/validate-with.decorator';
import type { InventarioService } from '../../domain/ports/inbound/inventario.service';
import { INVENTARIO_SERVICE_TOKEN } from '../../domain/ports/tokens';
import {
  CrearInventarioSchema,
  type CrearInventarioDto,
  ReservarInventarioSchema,
  type ReservarInventarioDto,
  ConsolidarReservaSchema,
  type ConsolidarReservaDto,
  AjustarInventarioSchema,
  type AjustarInventarioDto,
  ConsultarDisponibilidadSchema,
  type ConsultarDisponibilidadDto,
} from '../../application/schemas/inventario.schemas';
import type { ReservaResponseDto } from '../../application/dto/reserva-response.dto';
import type { DisponibilidadResponseDto } from '../../application/dto/disponibilidad-response.dto';
import type { InventarioResponseDto } from '../../application/dto/inventario-response.dto';
import {
  ApiCrearInventario,
  ApiReservarInventario,
  ApiConsolidarReserva,
  ApiAjustarInventario,
  ApiConsultarDisponibilidad,
  ApiObtenerInventarioPorItem,
  ApiEliminarInventario,
} from '../../docs/decorators/api-inventario.decorator.js';

@Controller('inventario')
@ApiTags('Inventario')
export class InventarioController {
  constructor(
    @Inject(INVENTARIO_SERVICE_TOKEN)
    private readonly inventarioService: InventarioService,
  ) {}

  @Post()
  @ApiCrearInventario()
  @ValidateWith(CrearInventarioSchema)
  @HttpCode(HttpStatus.CREATED)
  async crearInventario(
    @Body() dto: CrearInventarioDto,
  ): Promise<InventarioResponseDto> {
    return await this.inventarioService.crearInventario(dto);
  }

  @Post('reservar')
  @ApiReservarInventario()
  @ValidateWith(ReservarInventarioSchema)
  @HttpCode(HttpStatus.CREATED)
  async reservarInventario(
    @Body() dto: ReservarInventarioDto,
  ): Promise<ReservaResponseDto> {
    return await this.inventarioService.reservarInventario(dto);
  }

  @Patch('consolidar')
  @ApiConsolidarReserva()
  @ValidateWith(ConsolidarReservaSchema)
  @HttpCode(HttpStatus.OK)
  async consolidarReserva(
    @Body() dto: ConsolidarReservaDto,
  ): Promise<{ message: string }> {
    await this.inventarioService.consolidarReserva(dto);
    return { message: 'Reserva consolidada exitosamente' };
  }

  @Patch('ajustar')
  @ApiAjustarInventario()
  @ValidateWith(AjustarInventarioSchema)
  @HttpCode(HttpStatus.OK)
  async ajustarInventario(
    @Body() dto: AjustarInventarioDto,
  ): Promise<{ message: string }> {
    await this.inventarioService.ajustarInventario(dto);
    return { message: 'Inventario ajustado exitosamente' };
  }

  @Get('disponibilidad')
  @ApiConsultarDisponibilidad()
  @ValidateWith(ConsultarDisponibilidadSchema)
  async consultarDisponibilidad(
    @Query() query: ConsultarDisponibilidadDto,
  ): Promise<DisponibilidadResponseDto> {
    return await this.inventarioService.consultarDisponibilidad(query);
  }

  @Get('item/:tipoItem/:itemId')
  @ApiObtenerInventarioPorItem()
  async obtenerInventarioPorItem(
    @Param('tipoItem') tipoItem: string,
    @Param('itemId') itemId: string,
  ): Promise<InventarioResponseDto> {
    return await this.inventarioService.obtenerInventarioPorItem(
      tipoItem,
      itemId,
    );
  }

  @Delete(':inventarioId')
  @ApiEliminarInventario()
  @HttpCode(HttpStatus.OK)
  async eliminarInventario(
    @Param('inventarioId') inventarioId: string,
  ): Promise<{ message: string }> {
    await this.inventarioService.eliminarInventario({ inventarioId });
    return { message: 'Inventario eliminado exitosamente' };
  }
}
