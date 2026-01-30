/**
 * Formato de error individual de validación de Zod.
 * Corresponde al formato generado por ZodValidationPipe.
 */
export interface ZodValidationError {
  campo: string;
  mensaje: string;
  codigo: string;
}

/**
 * Formato de respuesta completa del ZodValidationPipe.
 * Se lanza como contenido de BadRequestException cuando la validación falla.
 */
export interface ZodValidationResponse {
  mensaje: string;
  errores: ZodValidationError[];
}
