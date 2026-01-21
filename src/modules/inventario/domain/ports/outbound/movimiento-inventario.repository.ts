import { MovimientoInventario } from '../../aggregates/inventario/movimiento-inventario.entity';
import { MOVIMIENTO_INVENTARIO_REPOSITORY_TOKEN } from '../tokens';

// Re-exportar token para conveniencia
export { MOVIMIENTO_INVENTARIO_REPOSITORY_TOKEN };

export interface MovimientoInventarioRepository {
  guardar(movimiento: MovimientoInventario): Promise<void>;
  buscarPorInventario(
    inventarioId: string,
    limit?: number,
    offset?: number,
  ): Promise<MovimientoInventario[]>;
}
