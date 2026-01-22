/**
 * Estructura estándar de respuesta para todos los endpoints de la API.
 */
export interface ApiResponse<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
  errors: ErrorDetail[];
}

export interface ErrorDetail {
  message: string;
  code: string;
}
