import { Mapper } from '../../../../shared/application/mapper';
import {
  InventoryItem,
  SKU,
  Quantity,
} from '../../domain/inventory-item.entity';
import { InventoryItemDTO } from '../../presentation/dtos/inventory-item.dto';

export class InventoryItemMapper extends Mapper<
  InventoryItem,
  InventoryItemDTO
> {
  toDomain(raw: any): InventoryItem {
    return InventoryItem.restore(
      {
        sku: new SKU(raw.sku),
        productId: raw.productId,
        quantity: new Quantity(raw.quantity),
        reservedQuantity: new Quantity(raw.reservedQuantity),
        minimumThreshold: raw.minimumThreshold,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      raw.id,
    );
  }

  toDTO(domain: InventoryItem): InventoryItemDTO {
    const props = domain.unpack();
    const dto = new InventoryItemDTO();
    dto.id = domain.id;
    dto.sku = props.sku.value;
    dto.productId = props.productId;
    dto.quantity = props.quantity.value;
    dto.reservedQuantity = props.reservedQuantity.value;
    dto.availableQuantity = domain.availableQuantity.value;
    dto.minimumThreshold = props.minimumThreshold;
    dto.isLowStock = domain.isLowStock();
    dto.createdAt = props.createdAt;
    dto.updatedAt = props.updatedAt;
    return dto;
  }

  toPersistence(domain: InventoryItem): any {
    const props = domain.unpack();
    return {
      id: domain.id,
      sku: props.sku.value,
      productId: props.productId,
      quantity: props.quantity.value,
      reservedQuantity: props.reservedQuantity.value,
      minimumThreshold: props.minimumThreshold,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }
}
