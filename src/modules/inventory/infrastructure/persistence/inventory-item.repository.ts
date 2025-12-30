import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InventoryItemSchema } from './inventory-item.schema';
import { IInventoryRepository } from '../../domain/inventory.repository';
import {
  InventoryItem,
  SKU,
  Quantity,
} from '../../domain/inventory-item.entity';

/**
 * Repository Implementation (Adapter)
 * Convierte entre:
 * - InventoryItem (Agregado de dominio)
 * - InventoryItemSchema (Tabla de BD)
 *
 * Esto permite cambiar de TypeORM a Prisma, MongoDB, etc, sin tocar el dominio
 */
@Injectable()
export class TypeOrmInventoryRepository implements IInventoryRepository {
  private repository: Repository<InventoryItemSchema>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(InventoryItemSchema);
  }

  async save(entity: InventoryItem): Promise<void> {
    const props = entity.unpack();
    const schema = {
      id: entity.id,
      sku: props.sku.value,
      productId: props.productId,
      quantity: props.quantity.value,
      reservedQuantity: props.reservedQuantity.value,
      minimumThreshold: props.minimumThreshold,
      createdAt: props.createdAt,
      updatedAt: new Date(),
    };

    await this.repository.upsert(schema, ['id']);
  }

  async findById(id: string): Promise<InventoryItem | null> {
    const schema = await this.repository.findOne({ where: { id } });

    if (!schema) {
      return null;
    }

    return this.toDomain(schema);
  }

  async findBySku(sku: string): Promise<InventoryItem | null> {
    const schema = await this.repository.findOne({ where: { sku } });

    if (!schema) {
      return null;
    }

    return this.toDomain(schema);
  }

  async findByProductId(productId: string): Promise<InventoryItem[]> {
    const schemas = await this.repository.find({ where: { productId } });
    return schemas.map((schema) => this.toDomain(schema));
  }

  async findLowStockItems(): Promise<InventoryItem[]> {
    const schemas = await this.repository
      .createQueryBuilder('item')
      .where('item.quantity <= item.minimumThreshold')
      .getMany();

    return schemas.map((schema) => this.toDomain(schema));
  }

  async findAll(): Promise<InventoryItem[]> {
    const schemas = await this.repository.find();
    return schemas.map((schema) => this.toDomain(schema));
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async count(): Promise<number> {
    return this.repository.count();
  }

  private toDomain(schema: InventoryItemSchema): InventoryItem {
    return InventoryItem.restore(
      {
        sku: new SKU(schema.sku),
        productId: schema.productId,
        quantity: new Quantity(schema.quantity),
        reservedQuantity: new Quantity(schema.reservedQuantity),
        minimumThreshold: schema.minimumThreshold,
        createdAt: schema.createdAt,
        updatedAt: schema.updatedAt,
      },
      schema.id,
    );
  }
}
