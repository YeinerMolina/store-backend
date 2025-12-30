import { AggregateRoot, DomainEvent } from '../../../shared/domain/entity';
import {
  InvalidArgumentException,
  InsufficientException,
} from '../../../shared/domain/exceptions/domain.exception';

/**
 * Value Object para SKU (Stock Keeping Unit)
 */
export class SKU {
  constructor(public readonly value: string) {
    if (!value || value.trim() === '') {
      throw new InvalidArgumentException('SKU cannot be empty');
    }
    if (value.length > 50) {
      throw new InvalidArgumentException('SKU cannot exceed 50 characters');
    }
  }

  equals(other: SKU): boolean {
    return this.value === other.value;
  }
}

/**
 * Value Object para Cantidad
 */
export class Quantity {
  constructor(public readonly value: number) {
    if (!Number.isInteger(value) || value < 0) {
      throw new InvalidArgumentException('Quantity must be a positive integer');
    }
  }

  add(quantity: Quantity): Quantity {
    return new Quantity(this.value + quantity.value);
  }

  subtract(quantity: Quantity): Quantity {
    const result = this.value - quantity.value;
    if (result < 0) {
      throw new InsufficientException('Inventory', quantity.value, this.value);
    }
    return new Quantity(result);
  }

  isGreaterThanOrEqual(quantity: Quantity): boolean {
    return this.value >= quantity.value;
  }
}

/**
 * Eventos de dominio del inventario
 */
export class InventoryItemCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly sku: string,
    public readonly quantity: number,
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'inventory.item.created';
  }
}

export class InventoryQuantityAdjustedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly sku: string,
    public readonly previousQuantity: number,
    public readonly newQuantity: number,
    public readonly reason: string,
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'inventory.quantity.adjusted';
  }
}

export class StockReservedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly sku: string,
    public readonly reservedQuantity: number,
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'inventory.stock.reserved';
  }
}

export class StockReleasedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly sku: string,
    public readonly releasedQuantity: number,
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'inventory.stock.released';
  }
}

/**
 * InventoryItem Aggregate Root
 * Representa un producto en el inventario
 */
export interface InventoryItemProps {
  sku: SKU;
  productId: string;
  quantity: Quantity;
  reservedQuantity: Quantity;
  minimumThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

export class InventoryItem extends AggregateRoot<InventoryItemProps> {
  private constructor(props: InventoryItemProps, id?: string) {
    super(props, id);
  }

  static create(
    sku: SKU,
    productId: string,
    quantity: Quantity,
    minimumThreshold: number = 10,
  ): InventoryItem {
    const item = new InventoryItem({
      sku,
      productId,
      quantity,
      reservedQuantity: new Quantity(0),
      minimumThreshold,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    item.addDomainEvent(
      new InventoryItemCreatedEvent(item.id, sku.value, quantity.value),
    );

    return item;
  }

  static restore(props: InventoryItemProps, id: string): InventoryItem {
    return new InventoryItem(props, id);
  }

  get sku(): SKU {
    return this.props.sku;
  }

  get productId(): string {
    return this.props.productId;
  }

  get quantity(): Quantity {
    return this.props.quantity;
  }

  get reservedQuantity(): Quantity {
    return this.props.reservedQuantity;
  }

  get availableQuantity(): Quantity {
    return new Quantity(
      this.props.quantity.value - this.props.reservedQuantity.value,
    );
  }

  get minimumThreshold(): number {
    return this.props.minimumThreshold;
  }

  isLowStock(): boolean {
    return this.quantity.value <= this.minimumThreshold;
  }

  adjustQuantity(newQuantity: Quantity, reason: string): void {
    const previousQuantity = this.props.quantity.value;
    this.props.quantity = newQuantity;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new InventoryQuantityAdjustedEvent(
        this.id,
        this.sku.value,
        previousQuantity,
        newQuantity.value,
        reason,
      ),
    );
  }

  reserveStock(quantity: Quantity): void {
    if (!this.availableQuantity.isGreaterThanOrEqual(quantity)) {
      throw new InsufficientException(
        'Available inventory',
        quantity.value,
        this.availableQuantity.value,
      );
    }

    this.props.reservedQuantity = this.props.reservedQuantity.add(quantity);
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new StockReservedEvent(this.id, this.sku.value, quantity.value),
    );
  }

  releaseStock(quantity: Quantity): void {
    if (!this.props.reservedQuantity.isGreaterThanOrEqual(quantity)) {
      throw new InvalidArgumentException(
        'Cannot release more stock than reserved',
      );
    }

    this.props.reservedQuantity =
      this.props.reservedQuantity.subtract(quantity);
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new StockReleasedEvent(this.id, this.sku.value, quantity.value),
    );
  }
}
