import { UUID } from '../../../../../shared/domain/value-objects/uuid.vo';
import { Money } from '../../../../../shared/domain/value-objects/money.vo';

/**
 * PUERTO OUTBOUND (Driven Port)
 * Define el contrato para comunicación con el módulo CATALOGO
 */

export interface ProductoInfo {
  id: UUID;
  nombre: string;
  precioVigente: Money;
  estaActivo: boolean;
}

export interface ICatalogoPort {
  /**
   * Obtener precio vigente de un producto/paquete
   */
  obtenerPrecioVigente(itemId: UUID): Promise<Money>;

  /**
   * Obtener información completa de un producto
   */
  obtenerProducto(itemId: UUID): Promise<ProductoInfo | null>;

  /**
   * Obtener información de múltiples productos
   */
  obtenerProductosMultiples(itemIds: UUID[]): Promise<ProductoInfo[]>;
}
