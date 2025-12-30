import type { IRepository } from '../../../shared/ports/repository.port';
import { InventoryItem } from './inventory-item.entity';

/**
 * Repository específico del módulo Inventory
 * Extiende el contrato general con métodos específicos del negocio
 */
export interface IInventoryRepository extends IRepository<InventoryItem> {
  /**
   * Busca por SKU (es un identificador del negocio)
   */
  findBySku(sku: string): Promise<InventoryItem | null>;

  /**
   * Busca todos los items de un producto
   */
  findByProductId(productId: string): Promise<InventoryItem[]>;

  /**
   * Busca items que estén bajo el threshold mínimo
   */
  findLowStockItems(): Promise<InventoryItem[]>;
}

export const INVENTORY_REPOSITORY_TOKEN = 'IInventoryRepository';
