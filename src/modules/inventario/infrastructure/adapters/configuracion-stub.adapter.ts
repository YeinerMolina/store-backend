import { Injectable } from '@nestjs/common';
import type { ConfiguracionPort } from '../../domain/ports/outbound/configuracion.port';
import { ParametroConfiguracionInventario } from '../../domain/aggregates/inventario/types';

/**
 * Temporary stub until CONFIGURACION module exists.
 * Replace with ConfiguracionDatabaseAdapter when ready.
 */
@Injectable()
export class ConfiguracionStubAdapter implements ConfiguracionPort {
  private readonly valoresPorDefecto: Record<
    ParametroConfiguracionInventario,
    number
  > = {
    [ParametroConfiguracionInventario.DURACION_RESERVA_VENTA]: 1200,
    [ParametroConfiguracionInventario.DURACION_RESERVA_CAMBIO]: 1200,
    [ParametroConfiguracionInventario.UMBRAL_STOCK_BAJO]: 10,
  };

  async obtenerParametro(
    parametro: ParametroConfiguracionInventario,
  ): Promise<number> {
    return this.valoresPorDefecto[parametro];
  }
}
