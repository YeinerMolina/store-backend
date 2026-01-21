// TODO: Implementar cuando CATALOGO esté disponible
export interface ProductoPort {
  existeProducto(id: string): Promise<boolean>;
}
