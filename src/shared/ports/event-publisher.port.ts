import { DomainEvent } from '../domain/entity';

/**
 * Event Publisher Port
 * Contrato para publicar eventos de dominio
 * Los módulos se comunican de forma asíncrona vía eventos
 *
 * Implementación: RabbitMQ, Kafka, Redis Pub/Sub, etc
 */
export interface IEventPublisher {
  /**
   * Publica un evento
   */
  publish(event: DomainEvent): Promise<void>;

  /**
   * Publica múltiples eventos
   */
  publishMany(events: DomainEvent[]): Promise<void>;
}

/**
 * Event Subscriber Port
 * Contrato para suscribirse a eventos
 */
export interface IEventSubscriber {
  /**
   * Se suscribe a un tipo de evento
   */
  subscribe<T extends DomainEvent>(
    eventName: string,
    handler: (event: T) => Promise<void>,
  ): void;

  /**
   * Desuscribirse
   */
  unsubscribe(eventName: string): void;
}
