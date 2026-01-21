import { Injectable } from '@nestjs/common';
import type { EventBusPort } from '../../domain/ports/outbound/event-bus.port';

@Injectable()
export class EventBusConsoleAdapter implements EventBusPort {
  async publicar(evento: any): Promise<void> {
    console.log('[EVENT]', evento.constructor.name, evento);
    // TODO: Implementar EventBusRedisAdapter cuando Redis esté disponible
  }
}
