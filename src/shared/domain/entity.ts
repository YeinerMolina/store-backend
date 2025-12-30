import { v4 as uuid } from 'uuid';

/**
 * Entity base
 * Representa objetos del dominio que tienen identidad.
 * Ej: Product, Order, Customer
 *
 * Dos entities son iguales si tienen el mismo ID, sin importar sus propiedades
 */
export abstract class Entity<Props> {
  protected readonly _id: string;
  protected props: Props;

  constructor(props: Props, id?: string) {
    this.props = props;
    this._id = id || uuid();
  }

  get id(): string {
    return this._id;
  }

  public equals(entity?: Entity<Props>): boolean {
    if (entity === undefined || entity === null) {
      return false;
    }
    return this._id === entity._id;
  }

  public unpack(): Props & { id: string } {
    return {
      ...this.props,
      id: this._id,
    };
  }
}

/**
 * Aggregate Root
 * Entity que es raíz de un agregado.
 * Tiene eventos de dominio que pueden publicarse.
 * Ej: Order (con OrderItems dentro), Product (con Inventory dentro)
 */
export abstract class AggregateRoot<Props> extends Entity<Props> {
  private domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  public getDomainEvents(): DomainEvent[] {
    return this.domainEvents;
  }

  public clearDomainEvents(): void {
    this.domainEvents = [];
  }
}

/**
 * Event de dominio
 * Se dispara cuando algo importante ocurre en el negocio
 * Ej: OrderCreated, PaymentProcessed, InventoryUpdated
 */
export abstract class DomainEvent {
  public readonly occurredAt: Date;
  public readonly aggregateId: string;

  constructor(aggregateId: string) {
    this.aggregateId = aggregateId;
    this.occurredAt = new Date();
  }

  abstract getEventName(): string;
}
