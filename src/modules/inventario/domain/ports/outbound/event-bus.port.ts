import { EVENT_BUS_PORT_TOKEN } from '../tokens';

// Re-exportar token para conveniencia
export { EVENT_BUS_PORT_TOKEN };

export interface EventBusPort {
  publicar(evento: any): Promise<void>;
}
