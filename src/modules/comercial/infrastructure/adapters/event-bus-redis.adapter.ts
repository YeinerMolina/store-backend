import { Injectable } from '@nestjs/common';
import type { EventoDominioBase } from '../../../../shared/domain/events/evento-dominio.base';
import type { EventBusPort } from '../../domain/ports/outbound/event-bus.port';

/**
 * ADAPTADOR OUTBOUND: EventBusRedisAdapter
 * Implementa el puerto EventBusPort usando Redis Pub/Sub
 * Publica eventos de dominio para comunicación asíncrona
 *
 * Otras posibles implementaciones:
 * - EventBusRabbitMQAdapter
 * - EventBusKafkaAdapter
 * - EventBusInMemoryAdapter (para tests)
 */
@Injectable()
export class EventBusRedisAdapter implements EventBusPort {
  // TODO: Inyectar cliente de Redis

  async publish(evento: EventoDominioBase): Promise<void> {
    // TODO: Implementar publicación real en Redis
    // await this.redis.publish('eventos-dominio', JSON.stringify(evento.toPrimitives()));

    console.log(
      `[EventBusRedisAdapter] Publicando evento: ${evento.tipoEvento}`,
      evento.toPrimitives(),
    );

    // TODO: Persistir en módulo AUDITORIA
    // await this.auditoriaPort.registrarEvento(evento);
  }

  async publishBatch(eventos: EventoDominioBase[]): Promise<void> {
    // TODO: Implementar publicación batch en Redis
    // const pipeline = this.redis.pipeline();
    // eventos.forEach(e => pipeline.publish('eventos-dominio', JSON.stringify(e.toPrimitives())));
    // await pipeline.exec();

    console.log(
      `[EventBusRedisAdapter] Publicando ${eventos.length} eventos en batch`,
    );

    for (const evento of eventos) {
      await this.publish(evento);
    }
  }
}
