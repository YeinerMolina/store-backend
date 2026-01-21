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
  UsePipes,
} from '@nestjs/common';
import type { InventarioService } from '../../domain/ports/inbound/inventario.service';
import { INVENTARIO_SERVICE_TOKEN } from '../../domain/ports/tokens';
import { ZodValidationPipe } from '../../../../shared/pipes/zod-validation.pipe';
import {
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

@Controller('inventario')
export class InventarioController {
  constructor(
    @Inject(INVENTARIO_SERVICE_TOKEN)
    private readonly inventarioService: InventarioService,
  ) {}

  @Post('reservar')
  @HttpCode(HttpStatus.CREATED)
  async reservarInventario(
    @Body(new ZodValidationPipe(ReservarInventarioSchema))
    dto: ReservarInventarioDto,
  ): Promise<ReservaResponseDto> {
    return await this.inventarioService.reservarInventario(dto);
  }

  @Post('consolidar')
  @HttpCode(HttpStatus.NO_CONTENT)
  async consolidarReserva(
    @Body(new ZodValidationPipe(ConsolidarReservaSchema))
    dto: ConsolidarReservaDto,
  ): Promise<void> {
    await this.inventarioService.consolidarReserva(dto);
  }

  @Post('ajustar')
  @HttpCode(HttpStatus.NO_CONTENT)
  async ajustarInventario(
    @Body(new ZodValidationPipe(AjustarInventarioSchema))
    dto: AjustarInventarioDto,
  ): Promise<void> {
    await this.inventarioService.ajustarInventario(dto);
  }

  @Get('disponibilidad')
  async consultarDisponibilidad(
    @Query(new ZodValidationPipe(ConsultarDisponibilidadSchema))
    query: ConsultarDisponibilidadDto,
  ): Promise<DisponibilidadResponseDto> {
    return await this.inventarioService.consultarDisponibilidad(query);
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
