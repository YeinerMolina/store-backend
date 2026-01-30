/**
 * Ejemplos de respuestas de error generadas por HttpExceptionFilter.
 * Se usan directamente en decoradores ApiResponse para evitar dependencias circulares de Swagger.
 */

export const ERROR_404_EXAMPLE = {
  ok: false,
  status: 404,
  data: null,
  errors: [
    {
      code: 'NOT_FOUND',
      message: 'Recurso no encontrado',
    },
  ],
};

export const ERROR_409_EXAMPLE = {
  ok: false,
  status: 409,
  data: null,
  errors: [
    {
      code: 'CONFLICT',
      message: 'Conflicto de concurrencia',
    },
  ],
};

export const ERROR_422_EXAMPLE = {
  ok: false,
  status: 422,
  data: null,
  errors: [
    {
      code: 'STOCK_INSUFICIENTE',
      message: 'No hay suficiente stock disponible',
    },
  ],
};

export const ERROR_400_VALIDATION_EXAMPLE = {
  ok: false,
  status: 400,
  data: null,
  errors: [
    {
      code: 'VALIDATION_ERROR',
      message: 'tipoItem: Debe ser PRODUCTO o PAQUETE',
    },
    {
      code: 'VALIDATION_ERROR',
      message: 'cantidad: Debe ser un número positivo',
    },
  ],
};

export const ERROR_500_EXAMPLE = {
  ok: false,
  status: 500,
  data: null,
  errors: [
    {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Error interno del servidor',
    },
  ],
};
