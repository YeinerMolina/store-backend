import { EventoDominioBase } from '../../../../../shared/domain/events/evento-dominio.base';

/**
 * PUERTO OUTBOUND (Driven Port)
 * Define el contrato para publicación de eventos de dominio
 * La infraestructura (Redis, RabbitMQ, etc.) implementa esta interfaz
 */
export interface IEventBusPort {
  /**
   * Publicar un evento de dominio
   */
  publish(evento: EventoDominioBase): Promise<void>;

  /**
   * Publicar múltiples eventos en batch
   */
  publishBatch(eventos: EventoDominioBase[]): Promise<void>;
}
