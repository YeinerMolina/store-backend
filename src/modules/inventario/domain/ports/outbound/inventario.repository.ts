import { Inventario } from '../../aggregates/inventario/inventario.entity';

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
