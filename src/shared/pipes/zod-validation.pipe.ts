import {
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

/**
 * PIPE DE VALIDACIÓN CON ZOD
 *
 * Pipe global que valida DTOs usando schemas de Zod
 *
 * VENTAJAS sobre class-validator:
 * - Type-safety completo (inferencia de tipos)
 * - Performance superior
 * - Menos decoradores
 * - Transformaciones integradas
 * - Mensajes de error más claros
 *
 * USO:
 * ```typescript
 * @Post()
 * async crear(@Body(new ZodValidationPipe(CreateUsuarioSchema)) dto: CreateUsuarioDto) {
 *   // dto ya está validado y transformado
 * }
 * ```
 */
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      // Validar y transformar
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      if (error instanceof ZodError) {
        // Formatear errores de Zod a estructura NestJS
        const formattedErrors = this.formatZodErrors(error);
        throw new BadRequestException({
          mensaje: 'Error de validación',
          errores: formattedErrors,
        });
      }
      throw new BadRequestException('Error de validación');
    }
  }

  private formatZodErrors(error: ZodError) {
    return error.issues.map((err) => ({
      campo: err.path.join('.'),
      mensaje: err.message,
      codigo: err.code,
    }));
  }
}
