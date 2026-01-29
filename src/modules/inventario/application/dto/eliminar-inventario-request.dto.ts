/**
 * DTO para solicitud de eliminación de inventario
 * La eliminación es lógica (soft delete) y solo es permitida si no hay dependencias
 */
export class EliminarInventarioRequestDto {
  /**
   * ID del inventario a eliminar
   */
  readonly inventarioId: string;
}
