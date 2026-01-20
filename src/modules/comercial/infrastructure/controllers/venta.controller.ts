import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { UUID } from '../../../../shared/domain/value-objects/uuid.vo';
import type { IVentaService } from '../../domain/ports/inbound/i-venta.service';
import {
  CrearVentaDto,
  CrearVentaResponseDto,
} from '../../application/dto/crear-venta.dto';

/**
 * ADAPTADOR PRIMARIO (Driving Adapter): VentaController
 * Expone endpoints HTTP
 * Depende del puerto inbound (IVentaService)
 *
 * IMPORTANTE:
 * - No conoce la implementación del servicio
 * - Solo conoce el puerto (interfaz)
 * - Traduce HTTP → Dominio y Dominio → HTTP
 */
@Controller('ventas')
export class VentaController {
  constructor(private readonly ventaService: IVentaService) {}

  @Post()
  async crearDesdeCarrito(
    @Body() dto: CrearVentaDto,
  ): Promise<CrearVentaResponseDto> {
    const carritoId = UUID.fromString(dto.carritoId);
    const clienteId = UUID.fromString(dto.clienteId);

    const venta = await this.ventaService.crearDesdeCarrito(
      carritoId,
      clienteId,
    );

    return {
      ventaId: venta.getId().toString(),
      estado: venta.getEstado(),
      total: venta.getTotal().getAmount(),
      moneda: venta.getTotal().getCurrency(),
      fechaCreacion: new Date().toISOString(),
    };
  }

  @Post(':id/confirmar')
  async confirmarVenta(
    @Param('id') ventaId: string,
  ): Promise<{ mensaje: string }> {
    const id = UUID.fromString(ventaId);
    await this.ventaService.confirmarVenta(id);

    return { mensaje: 'Venta confirmada exitosamente' };
  }

  @Get(':id')
  async obtenerVenta(@Param('id') ventaId: string) {
    const id = UUID.fromString(ventaId);
    const venta = await this.ventaService.obtenerPorId(id);

    if (!venta) {
      throw new Error('Venta no encontrada');
    }

    return {
      id: venta.getId().toString(),
      clienteId: venta.getClienteId().toString(),
      estado: venta.getEstado(),
      total: venta.getTotal().getAmount(),
      lineas: venta.getLineas().length,
    };
  }
}
