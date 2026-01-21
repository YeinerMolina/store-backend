import { MovimientoInventario } from '../../aggregates/inventario/movimiento-inventario.entity';

export interface MovimientoInventarioRepository {
  guardar(movimiento: MovimientoInventario): Promise<void>;
  buscarPorInventario(
    inventarioId: string,
    limit?: number,
    offset?: number,
  ): Promise<MovimientoInventario[]>;
}
