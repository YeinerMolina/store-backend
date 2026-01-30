/**
 * Interface para tipo de respuesta exitosa (no usar en decoradores Swagger).
 * Swagger no soporta genéricos - usar objetos example directamente en ApiResponse.
 */
export interface ApiSuccessResponseSchema<T> {
  ok: boolean;
  status: number;
  data: T;
  errors: unknown[];
}
