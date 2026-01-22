import {
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

/**
 * Pipe de validación con Zod.
 * Valida y transforma DTOs con type-safety completo.
 */
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      if (error instanceof ZodError) {
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
