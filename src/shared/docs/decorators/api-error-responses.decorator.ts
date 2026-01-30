import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import {
  ERROR_400_VALIDATION_EXAMPLE,
  ERROR_404_EXAMPLE,
  ERROR_409_EXAMPLE,
  ERROR_422_EXAMPLE,
  ERROR_500_EXAMPLE,
} from '../schemas/error-response.schema.js';

export const ApiCommonErrorResponses = () => {
  return applyDecorators(
    ApiResponse({
      status: 400,
      description: 'Validación fallida o parámetros inválidos',
      schema: { example: ERROR_400_VALIDATION_EXAMPLE },
    }),
    ApiResponse({
      status: 500,
      description: 'Error interno del servidor',
      schema: { example: ERROR_500_EXAMPLE },
    }),
  );
};

export const ApiNotFoundResponse = (resourceName: string) => {
  return ApiResponse({
    status: 404,
    description: `${resourceName} no encontrado`,
    schema: {
      example: {
        ...ERROR_404_EXAMPLE,
        errors: [
          {
            code: 'NOT_FOUND',
            message: `${resourceName} no encontrado`,
          },
        ],
      },
    },
  });
};

export const ApiConflictResponse = (description: string) => {
  return ApiResponse({
    status: 409,
    description,
    schema: {
      example: {
        ...ERROR_409_EXAMPLE,
        errors: [
          {
            code: 'CONFLICT',
            message: description,
          },
        ],
      },
    },
  });
};

export const ApiUnprocessableEntityResponse = (description: string) => {
  return ApiResponse({
    status: 422,
    description,
    schema: {
      example: {
        ...ERROR_422_EXAMPLE,
        errors: [
          {
            code: 'VALIDATION_ERROR',
            message: description,
          },
        ],
      },
    },
  });
};
