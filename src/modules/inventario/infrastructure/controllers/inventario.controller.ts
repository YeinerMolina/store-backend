import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Inject,
} from '@nestjs/common';
import type { InventarioService } from '../../domain/ports/inbound/inventario.service';
import { ReservarInventarioRequestDto } from '../../application/dto/reservar-inventario-request.dto';
import { ConsolidarReservaRequestDto } from '../../application/dto/consolidar-reserva-request.dto';
import { AjustarInventarioRequestDto } from '../../application/dto/ajustar-inventario-request.dto';
import { ConsultarDisponibilidadRequestDto } from '../../application/dto/consultar-disponibilidad-request.dto';

@Controller('inventario')
export class InventarioController {
  constructor(
    @Inject('INVENTARIO_SERVICE')
    private readonly inventarioService: InventarioService,
  ) {}

  @Post('reservar')
  async reservarInventario(@Body() dto: ReservarInventarioRequestDto) {
    try {
      return await this.inventarioService.reservarInventario(dto);
    } catch (error: any) {
      return { error: error.message };
    }
  }

  @Post('consolidar')
  async consolidarReserva(@Body() dto: ConsolidarReservaRequestDto) {
    try {
      await this.inventarioService.consolidarReserva(dto);
      return { mensaje: 'Reserva consolidada exitosamente' };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  @Post('ajustar')
  async ajustarInventario(@Body() dto: AjustarInventarioRequestDto) {
    try {
      await this.inventarioService.ajustarInventario(dto);
      return { mensaje: 'Inventario ajustado exitosamente' };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  @Get('disponibilidad')
  async consultarDisponibilidad(@Query() query: any) {
    try {
      const dto: ConsultarDisponibilidadRequestDto = {
        tipoItem: query.tipoItem,
        itemId: query.itemId,
        cantidad: parseInt(query.cantidad),
      };
      return await this.inventarioService.consultarDisponibilidad(dto);
    } catch (error: any) {
      return { error: error.message };
    }
  }

  @Get('item/:tipoItem/:itemId')
  async obtenerInventarioPorItem(
    @Param('tipoItem') tipoItem: string,
    @Param('itemId') itemId: string,
  ) {
    try {
      return await this.inventarioService.obtenerInventarioPorItem(
        tipoItem,
        itemId,
      );
    } catch (error: any) {
      return { error: error.message };
    }
  }
}
