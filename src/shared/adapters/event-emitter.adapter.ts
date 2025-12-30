import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from 'eventemitter2';
import { DomainEvent } from '../domain/entity';
import {
  IEventPublisher,
  IEventSubscriber,
} from '../ports/event-publisher.port';

/**
 * Implementación de Event Publisher usando EventEmitter2
 * Para desarrollo/monolito. En producción, reemplazar con RabbitMQ o Kafka
 */
@Injectable()
export class EventEmitterAdapter implements IEventPublisher, IEventSubscriber {
  constructor(private eventEmitter: EventEmitter2) {}

  async publish(event: DomainEvent): Promise<void> {
    const eventName = event.getEventName();
    this.eventEmitter.emit(eventName, event);
  }

  async publishMany(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  subscribe<T extends DomainEvent>(
    eventName: string,
    handler: (event: T) => Promise<void>,
  ): void {
    this.eventEmitter.on(eventName, async (event: T) => {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Error handling event ${eventName}:`, error);
        // En producción: log a sentry, retry logic, dead letter queue, etc
      }
    });
  }

  unsubscribe(eventName: string): void {
    this.eventEmitter.removeAllListeners(eventName);
  }
}
