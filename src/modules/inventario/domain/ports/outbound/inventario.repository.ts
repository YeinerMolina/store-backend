import { Inventario } from '../../aggregates/inventario/inventario.entity';
import { INVENTARIO_REPOSITORY_TOKEN } from '../tokens';

export { INVENTARIO_REPOSITORY_TOKEN };

export interface InventarioRepository {
  guardar(inventario: Inventario): Promise<void>;
  buscarPorId(id: string): Promise<Inventario | null>;
  buscarPorItem(tipoItem: string, itemId: string): Promise<Inventario | null>;
  buscarTodos(): Promise<Inventario[]>;
  guardarConTransaction(
    inventario: Inventario,
    operacionesAdicionales?: () => Promise<void>,
  ): Promise<void>;
}
