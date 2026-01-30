import { applyDecorators } from '@nestjs/common';
import {
  ApiCommonErrorResponses,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiUnprocessableEntityResponse,
} from '@shared/docs';

/**
 * Errores completos para operaciones de inventario.
 */
export const ApiInventarioErrorResponses = () => {
  return applyDecorators(
    ApiCommonErrorResponses(),
    ApiInventarioNotFound(),
    ApiInventarioConflict(),
    ApiInsufficientStock(),
  );
};

export const ApiInventarioNotFound = () => {
  return ApiNotFoundResponse('Inventario');
};

/**
 * Error de concurrencia optimista (campo version desactualizado).
 */
export const ApiInventarioConflict = () => {
  return ApiConflictResponse(
    'Conflicto de concurrencia. El inventario fue modificado por otro proceso.',
  );
};

/**
 * Stock insuficiente para completar la operación.
 */
export const ApiInsufficientStock = () => {
  return ApiUnprocessableEntityResponse(
    'Stock insuficiente para completar la operación',
  );
};
