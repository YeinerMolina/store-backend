import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Inject,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { InventarioService } from '../../domain/ports/inbound/inventario.service';
import { ReservarInventarioRequestDto } from '../../application/dto/reservar-inventario-request.dto';
import { ConsolidarReservaRequestDto } from '../../application/dto/consolidar-reserva-request.dto';
import { AjustarInventarioRequestDto } from '../../application/dto/ajustar-inventario-request.dto';
import { ConsultarDisponibilidadRequestDto } from '../../application/dto/consultar-disponibilidad-request.dto';
import { ReservaResponseDto } from '../../application/dto/reserva-response.dto';
import { DisponibilidadResponseDto } from '../../application/dto/disponibilidad-response.dto';
import { InventarioResponseDto } from '../../application/dto/inventario-response.dto';

@Controller('inventario')
export class InventarioController {
  constructor(
    @Inject('INVENTARIO_SERVICE')
    private readonly inventarioService: InventarioService,
  ) {}

  @Post('reservar')
  @HttpCode(HttpStatus.CREATED)
  async reservarInventario(
    @Body() dto: ReservarInventarioRequestDto,
  ): Promise<ReservaResponseDto> {
    return await this.inventarioService.reservarInventario(dto);
  }

  @Post('consolidar')
  @HttpCode(HttpStatus.NO_CONTENT)
  async consolidarReserva(
    @Body() dto: ConsolidarReservaRequestDto,
  ): Promise<void> {
    await this.inventarioService.consolidarReserva(dto);
  }

  @Post('ajustar')
  @HttpCode(HttpStatus.NO_CONTENT)
  async ajustarInventario(
    @Body() dto: AjustarInventarioRequestDto,
  ): Promise<void> {
    await this.inventarioService.ajustarInventario(dto);
  }

  @Get('disponibilidad')
  async consultarDisponibilidad(
    @Query() query: any,
  ): Promise<DisponibilidadResponseDto> {
    const dto: ConsultarDisponibilidadRequestDto = {
      tipoItem: query.tipoItem,
      itemId: query.itemId,
      cantidad: parseInt(query.cantidad),
    };
    return await this.inventarioService.consultarDisponibilidad(dto);
  }

  @Get('item/:tipoItem/:itemId')
  async obtenerInventarioPorItem(
    @Param('tipoItem') tipoItem: string,
    @Param('itemId') itemId: string,
  ): Promise<InventarioResponseDto> {
    return await this.inventarioService.obtenerInventarioPorItem(
      tipoItem,
      itemId,
    );
  }
}
