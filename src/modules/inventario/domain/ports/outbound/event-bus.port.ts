import { EVENT_BUS_PORT_TOKEN } from '../tokens';

export { EVENT_BUS_PORT_TOKEN };

export interface EventBusPort {
  publicar(evento: any): Promise<void>;
}
