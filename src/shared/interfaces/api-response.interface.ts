/**
 * Estructura estándar de respuesta para todos los endpoints de la API
 *
 * @template T - Tipo de dato que se retorna en caso de éxito
 */
export interface ApiResponse<T = unknown> {
  /**
   * Indica si la operación fue exitosa
   */
  ok: boolean;

  /**
   * Código de estado HTTP
   */
  status: number;

  /**
   * Datos de la respuesta (null en caso de error)
   */
  data: T | null;

  /**
   * Lista de errores (vacía en caso de éxito)
   */
  errors: ErrorDetail[];
}

/**
 * Detalle de un error individual
 */
export interface ErrorDetail {
  /**
   * Mensaje descriptivo del error
   */
  message: string;

  /**
   * Código único del error para identificación programática
   */
  code: string;
}
