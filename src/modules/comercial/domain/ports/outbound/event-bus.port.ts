import { EventoDominioBase } from '../../../../../shared/domain/events/evento-dominio.base';

/**
 * PUERTO OUTBOUND (Driven Port)
 * Define el contrato para publicación de eventos de dominio
 *
 * Implementaciones:
 * - EventBusRedis (Redis Pub/Sub)
 * - EventBusRabbitMQ (RabbitMQ)
 * - EventBusKafka (Apache Kafka)
 * - EventBusInMemory (Testing)
 */
export interface EventBusPort {
  /**
   * Publicar un evento de dominio
   */
  publish(evento: EventoDominioBase): Promise<void>;

  /**
   * Publicar múltiples eventos en batch
   */
  publishBatch(eventos: EventoDominioBase[]): Promise<void>;
}
