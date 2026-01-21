export interface EventBusPort {
  publicar(evento: any): Promise<void>;
}
