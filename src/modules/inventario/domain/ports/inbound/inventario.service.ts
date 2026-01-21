export interface InventarioService {
  reservarInventario(request: any): Promise<any>;
  consolidarReserva(request: any): Promise<void>;
  liberarReservasExpiradas(): Promise<void>;
  ajustarInventario(request: any): Promise<void>;
  consultarDisponibilidad(request: any): Promise<any>;
  obtenerInventarioPorItem(tipoItem: string, itemId: string): Promise<any>;
  detectarStockBajo(umbral: number): Promise<void>;
}
