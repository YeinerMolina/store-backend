import { applyDecorators, UsePipes } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';

/**
 * Applies Zod schema validation to a handler using a composable decorator.
 * Combines with @UsePipes internally to keep handler signatures clean.
 *
 * Side effects:
 * - Pipes are applied in order: earlier decorators execute first
 * - Validation errors throw BadRequestException with formatted Zod issues
 * - Type coercion follows Zod's strict mode rules
 *
 * @param schema - Zod schema for validating request body/query/params
 *
 * @example
 * ```typescript
 * @Post('reservar')
 * @ValidateWith(ReservarInventarioSchema)
 * async reservarInventario(@Body() dto: ReservarInventarioDto) { }
 * ```
 *
 * @see {@link ZodValidationPipe} for error formatting details
 */
export function ValidateWith(schema: ZodSchema) {
  return applyDecorators(UsePipes(new ZodValidationPipe(schema)));
}
