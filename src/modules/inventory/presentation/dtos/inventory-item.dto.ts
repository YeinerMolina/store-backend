import { BaseDTO } from '../../../../shared/application/base.dto';

export class InventoryItemDTO extends BaseDTO {
  declare id: string;
  sku: string;
  productId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minimumThreshold: number;
  isLowStock: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export class CreateInventoryItemDTO {
  sku: string;
  productId: string;
  quantity: number;
  minimumThreshold?: number;
}

export class UpdateInventoryItemDTO {
  quantity: number;
  reason: string;
}
