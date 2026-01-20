import { Injectable } from '@nestjs/common';
import type { EventoDominioBase } from '../../../../shared/domain/events/evento-dominio.base';
import type { IEventBusPort } from '../../domain/ports/outbound/i-event-bus.port';

/**
 * ADAPTADOR OUTBOUND: EventBusAdapter
 * Implementa el puerto IEventBusPort
 * Publica eventos de dominio (Redis, RabbitMQ, etc.)
 */
@Injectable()
export class EventBusAdapter implements IEventBusPort {
  // TODO: Inyectar cliente de Redis/RabbitMQ

  async publish(evento: EventoDominioBase): Promise<void> {
    // TODO: Implementar publicación real
    console.log(
      `[EventBusAdapter] Publicando evento: ${evento.tipoEvento}`,
      evento.toPrimitives(),
    );

    // Simular persistencia en AUDITORIA
    // await this.prisma.eventoDominio.create({ ... });
  }

  async publishBatch(eventos: EventoDominioBase[]): Promise<void> {
    // TODO: Implementar publicación batch
    console.log(
      `[EventBusAdapter] Publicando ${eventos.length} eventos en batch`,
    );

    for (const evento of eventos) {
      await this.publish(evento);
    }
  }
}
