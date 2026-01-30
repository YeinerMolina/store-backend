import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ApiInventarioErrorResponses } from './api-error-responses.decorator.js';
import {
  RESERVAR_INVENTARIO_REQUEST_EXAMPLE,
  RESERVA_RESPONSE_EXAMPLE,
  INVENTARIO_RESPONSE_EXAMPLE,
  DISPONIBILIDAD_RESPONSE_EXAMPLE,
  AJUSTAR_INVENTARIO_REQUEST_EXAMPLE,
  CONSOLIDAR_RESERVA_REQUEST_EXAMPLE,
  CREAR_INVENTARIO_REQUEST_EXAMPLE,
} from '../examples/inventario.examples.js';

export const ApiReservarInventario = () => {
  return applyDecorators(
    ApiTags('Inventario'),
    ApiOperation({
      summary: 'Reservar stock para venta o cambio',
      description:
        'Reserva temporal de 20 minutos. Usa control de concurrencia optimista.',
    }),
    ApiBody({
      schema: { example: RESERVAR_INVENTARIO_REQUEST_EXAMPLE },
    }),
    ApiResponse({
      status: 201,
      description: 'Reserva creada',
      schema: {
        example: {
          ok: true,
          status: 201,
          data: RESERVA_RESPONSE_EXAMPLE,
          errors: [],
        },
      },
    }),
    ApiInventarioErrorResponses(),
  );
};

export const ApiConsultarDisponibilidad = () => {
  return applyDecorators(
    ApiTags('Inventario'),
    ApiOperation({
      summary: 'Verificar disponibilidad de producto',
      description: 'Consulta en tiempo real si hay suficiente stock.',
    }),
    ApiQuery({
      name: 'tipoItem',
      enum: ['PRODUCTO', 'PAQUETE'],
      required: true,
    }),
    ApiQuery({
      name: 'itemId',
      type: String,
      required: true,
    }),
    ApiQuery({
      name: 'cantidad',
      type: Number,
      required: true,
      example: 5,
    }),
    ApiResponse({
      status: 200,
      schema: {
        example: {
          ok: true,
          status: 200,
          data: DISPONIBILIDAD_RESPONSE_EXAMPLE,
          errors: [],
        },
      },
    }),
    ApiInventarioErrorResponses(),
  );
};

export const ApiAjustarInventario = () => {
  return applyDecorators(
    ApiTags('Inventario'),
    ApiOperation({
      summary: 'Ajuste manual de inventario',
      description:
        'Ajuste por empleado autorizado. Genera MovimientoInventario.',
    }),
    ApiBody({
      schema: { example: AJUSTAR_INVENTARIO_REQUEST_EXAMPLE },
    }),
    ApiResponse({
      status: 200,
      schema: {
        example: {
          ok: true,
          status: 200,
          data: { message: 'Inventario ajustado exitosamente' },
          errors: [],
        },
      },
    }),
    ApiInventarioErrorResponses(),
  );
};

export const ApiObtenerInventarioPorItem = () => {
  return applyDecorators(
    ApiTags('Inventario'),
    ApiOperation({
      summary: 'Obtener datos de inventario',
      description: 'Recupera información completa de inventario por item.',
    }),
    ApiParam({
      name: 'tipoItem',
      enum: ['PRODUCTO', 'PAQUETE'],
    }),
    ApiParam({
      name: 'itemId',
      type: String,
    }),
    ApiResponse({
      status: 200,
      schema: {
        example: {
          ok: true,
          status: 200,
          data: INVENTARIO_RESPONSE_EXAMPLE,
          errors: [],
        },
      },
    }),
    ApiInventarioErrorResponses(),
  );
};

export const ApiConsolidarReserva = () => {
  return applyDecorators(
    ApiTags('Inventario'),
    ApiOperation({
      summary: 'Consolidar reserva de venta exitosa',
      description: 'Confirma la salida de stock previamente reservado.',
    }),
    ApiBody({
      schema: { example: CONSOLIDAR_RESERVA_REQUEST_EXAMPLE },
    }),
    ApiResponse({
      status: 200,
      schema: {
        example: {
          ok: true,
          status: 200,
          data: { message: 'Reserva consolidada exitosamente' },
          errors: [],
        },
      },
    }),
    ApiInventarioErrorResponses(),
  );
};

export const ApiCrearInventario = () => {
  return applyDecorators(
    ApiTags('Inventario'),
    ApiOperation({
      summary: 'Crear registro de inventario',
      description: 'Inicializa inventario para un nuevo producto o paquete.',
    }),
    ApiBody({
      schema: { example: CREAR_INVENTARIO_REQUEST_EXAMPLE },
    }),
    ApiResponse({
      status: 201,
      schema: {
        example: {
          ok: true,
          status: 201,
          data: INVENTARIO_RESPONSE_EXAMPLE,
          errors: [],
        },
      },
    }),
    ApiInventarioErrorResponses(),
  );
};

export const ApiEliminarInventario = () => {
  return applyDecorators(
    ApiTags('Inventario'),
    ApiOperation({
      summary: 'Eliminar inventario',
      description:
        'Elimina registro de inventario (solo si no tiene dependencias).',
    }),
    ApiParam({
      name: 'inventarioId',
      type: String,
    }),
    ApiResponse({
      status: 200,
      schema: {
        example: {
          ok: true,
          status: 200,
          data: { message: 'Inventario eliminado exitosamente' },
          errors: [],
        },
      },
    }),
    ApiInventarioErrorResponses(),
  );
};
