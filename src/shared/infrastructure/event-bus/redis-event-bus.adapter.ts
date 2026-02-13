import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { EventBusPort } from '@inventario/domain/ports/outbound/integrations';

/**
 * Redis Pub/Sub implementation of EventBusPort.
 * Channel convention: domain_events:{aggregate_type}
 * Graceful degradation: logs errors without crashing if Redis fails.
 */
@Injectable()
export class RedisEventBusAdapter implements EventBusPort {
  private readonly logger = new Logger(RedisEventBusAdapter.name);

  constructor(private readonly redisService: RedisService) {}

  async publicar(evento: any): Promise<void> {
    try {
      const client = this.redisService.getClient();
      const eventType = evento.constructor.name;
      const aggregateType = this.extractAggregateType(eventType);
      const channel = `domain_events:${aggregateType}`;

      const payload = JSON.stringify({
        eventType,
        aggregateId: evento.aggregateId || evento.inventarioId || 'unknown',
        timestamp: new Date().toISOString(),
        data: evento,
      });

      const subscribersCount = await client.publish(channel, payload);

      this.logger.log(
        `Published ${eventType} to ${channel} (${subscribersCount} subscribers)`,
      );
    } catch (error: any) {
      /**
       * Don't throw - app continues if Redis fails.
       * TODO: Add retry queue for failed events (Paso 5 - opcional).
       */
      this.logger.error(
        `Failed to publish ${evento.constructor.name}: ${error.message}`,
      );
    }
  }

  /**
   * InventarioCreado → inventario, ReservaConsolidada → reserva
   */
  private extractAggregateType(eventType: string): string {
    return eventType
      .replace(
        /(Creado|Actualizado|Eliminado|Reservado|Consolidado|Liberado|Ajustado|Expirado)$/,
        '',
      )
      .toLowerCase();
  }
}
