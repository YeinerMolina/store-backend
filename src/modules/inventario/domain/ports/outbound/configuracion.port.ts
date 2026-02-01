import type { ParametroConfiguracionInventario } from '../../aggregates/inventario/types';

/**
 * Puerto para obtener parámetros operativos del módulo CONFIGURACION.
 * Método unificado consulta BD en producción, stub retorna defaults ahora.
 */
export interface ConfiguracionPort {
  obtenerParametro(
    parametro: ParametroConfiguracionInventario,
  ): Promise<number>;
}
