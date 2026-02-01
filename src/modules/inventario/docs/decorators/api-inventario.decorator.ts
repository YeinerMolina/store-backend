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
  ERROR_EXAMPLES,
} from '../examples/inventario.examples.js';

export const ApiReservarInventario = () => {
  return applyDecorators(
    ApiTags('Inventario - Operaciones'),
    ApiOperation({
      summary: 'Reservar stock para venta o cambio',
      description:
        'Bloquea inventario temporalmente por 20 minutos mientras se completa venta o cambio. ' +
        'Expira automáticamente si no se consolida. Usa optimistic locking (versión) para prevenir race conditions.',
    }),
    ApiBody({
      schema: { example: RESERVAR_INVENTARIO_REQUEST_EXAMPLE },
    }),
    ApiResponse({
      status: 201,
      description: 'Reserva creada exitosamente',
      schema: {
        example: {
          ok: true,
          status: 201,
          data: RESERVA_RESPONSE_EXAMPLE,
          errors: [],
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Datos de entrada inválidos',
      schema: { example: ERROR_EXAMPLES.VALIDATION_ERROR },
    }),
    ApiResponse({
      status: 409,
      description: 'Stock insuficiente o conflicto de concurrencia',
      schema: { example: ERROR_EXAMPLES.STOCK_INSUFICIENTE },
    }),
    ApiInventarioErrorResponses(),
  );
};

export const ApiConsultarDisponibilidad = () => {
  return applyDecorators(
    ApiTags('Inventario - Consultas'),
    ApiOperation({
      summary: 'Verificar disponibilidad de producto',
      description:
        'Consulta en tiempo real si hay suficiente stock considerando cantidad disponible menos reservas activas. ' +
        'Usado por carrito digital antes de checkout y por ventas físicas antes de crear venta.',
    }),
    ApiQuery({
      name: 'tipoItem',
      enum: ['PRODUCTO', 'PAQUETE'],
      required: true,
      description: 'Tipo de item a consultar',
    }),
    ApiQuery({
      name: 'itemId',
      type: String,
      required: true,
      description: 'ID del producto o paquete (UUID v7)',
    }),
    ApiQuery({
      name: 'cantidad',
      type: Number,
      required: true,
      example: 5,
      description: 'Cantidad solicitada a verificar',
    }),
    ApiResponse({
      status: 200,
      description: 'Disponibilidad consultada',
      schema: {
        example: {
          ok: true,
          status: 200,
          data: DISPONIBILIDAD_RESPONSE_EXAMPLE,
          errors: [],
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Parámetros inválidos',
      schema: { example: ERROR_EXAMPLES.VALIDATION_ERROR },
    }),
    ApiResponse({
      status: 404,
      description: 'Inventario no encontrado para el item',
      schema: { example: ERROR_EXAMPLES.NOT_FOUND },
    }),
    ApiInventarioErrorResponses(),
  );
};

export const ApiAjustarInventario = () => {
  return applyDecorators(
    ApiTags('Inventario - Operaciones'),
    ApiOperation({
      summary: 'Ajuste manual de inventario',
      description:
        'Ajusta stock manualmente (positivo=ingreso, negativo=egreso) por razones operativas: ' +
        'producto dañado, merma, corrección de conteo, etc. Solo empleados autorizados. ' +
        'Genera MovimientoInventario auditable con empleado responsable.',
    }),
    ApiBody({
      schema: { example: AJUSTAR_INVENTARIO_REQUEST_EXAMPLE },
    }),
    ApiResponse({
      status: 200,
      description: 'Inventario ajustado correctamente',
      schema: {
        example: {
          ok: true,
          status: 200,
          data: { message: 'Inventario ajustado exitosamente' },
          errors: [],
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Datos de entrada inválidos',
      schema: { example: ERROR_EXAMPLES.VALIDATION_ERROR },
    }),
    ApiResponse({
      status: 404,
      description: 'Inventario no encontrado',
      schema: { example: ERROR_EXAMPLES.NOT_FOUND },
    }),
    ApiResponse({
      status: 409,
      description: 'Stock negativo resultante o conflicto de versión',
      schema: { example: ERROR_EXAMPLES.OPTIMISTIC_LOCKING },
    }),
    ApiInventarioErrorResponses(),
  );
};

export const ApiObtenerInventarioPorItem = () => {
  return applyDecorators(
    ApiTags('Inventario - Consultas'),
    ApiOperation({
      summary: 'Obtener datos de inventario',
      description:
        'Recupera información completa de inventario: disponible, reservado, abandonado, ubicación física, ' +
        'y versión para optimistic locking. No incluye inventarios marcados como eliminados.',
    }),
    ApiParam({
      name: 'tipoItem',
      enum: ['PRODUCTO', 'PAQUETE'],
      description: 'Tipo de item del inventario',
    }),
    ApiParam({
      name: 'itemId',
      type: String,
      description: 'ID del producto o paquete (UUID v7)',
    }),
    ApiResponse({
      status: 200,
      description: 'Inventario encontrado',
      schema: {
        example: {
          ok: true,
          status: 200,
          data: INVENTARIO_RESPONSE_EXAMPLE,
          errors: [],
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Inventario no encontrado o eliminado',
      schema: { example: ERROR_EXAMPLES.NOT_FOUND },
    }),
    ApiInventarioErrorResponses(),
  );
};

export const ApiConsolidarReserva = () => {
  return applyDecorators(
    ApiTags('Inventario - Operaciones'),
    ApiOperation({
      summary: 'Consolidar reserva de venta exitosa',
      description:
        'Confirma la salida definitiva de stock previamente reservado. ' +
        'Llamado después de completar pago exitoso en venta o ejecutar cambio. ' +
        'Mueve cantidad de "reservado" a "vendido" (resta de disponible). Genera MovimientoInventario.',
    }),
    ApiBody({
      schema: { example: CONSOLIDAR_RESERVA_REQUEST_EXAMPLE },
    }),
    ApiResponse({
      status: 200,
      description: 'Reserva consolidada, stock descontado',
      schema: {
        example: {
          ok: true,
          status: 200,
          data: { message: 'Reserva consolidada exitosamente' },
          errors: [],
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Datos de entrada inválidos',
      schema: { example: ERROR_EXAMPLES.VALIDATION_ERROR },
    }),
    ApiResponse({
      status: 404,
      description: 'Reserva no encontrada',
      schema: { example: ERROR_EXAMPLES.NOT_FOUND },
    }),
    ApiResponse({
      status: 422,
      description: 'Reserva expirada o en estado inválido',
      schema: { example: ERROR_EXAMPLES.ESTADO_INVALIDO },
    }),
    ApiInventarioErrorResponses(),
  );
};

export const ApiCrearInventario = () => {
  return applyDecorators(
    ApiTags('Inventario - Operaciones'),
    ApiOperation({
      summary: 'Crear registro de inventario',
      description:
        'Inicializa inventario para un nuevo producto o paquete recién agregado al catálogo. ' +
        'Define cantidad inicial y ubicación física. Genera MovimientoInventario de ingreso inicial.',
    }),
    ApiBody({
      schema: { example: CREAR_INVENTARIO_REQUEST_EXAMPLE },
    }),
    ApiResponse({
      status: 201,
      description: 'Inventario creado exitosamente',
      schema: {
        example: {
          ok: true,
          status: 201,
          data: INVENTARIO_RESPONSE_EXAMPLE,
          errors: [],
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Datos de entrada inválidos',
      schema: { example: ERROR_EXAMPLES.VALIDATION_ERROR },
    }),
    ApiResponse({
      status: 409,
      description: 'Ya existe inventario para este item',
      schema: {
        example: {
          statusCode: 409,
          message: 'Ya existe inventario para este producto/paquete',
          error: 'Conflict',
        },
      },
    }),
    ApiInventarioErrorResponses(),
  );
};

export const ApiEliminarInventario = () => {
  return applyDecorators(
    ApiTags('Inventario - Operaciones'),
    ApiOperation({
      summary: 'Eliminar inventario (soft delete)',
      description:
        'Marca inventario como eliminado sin borrado físico. ' +
        'Solo permitido si no tiene reservas activas ni movimientos pendientes. ' +
        'Puede revertirse con restauración.',
    }),
    ApiParam({
      name: 'inventarioId',
      type: String,
      description: 'ID del inventario a eliminar (UUID v7)',
    }),
    ApiResponse({
      status: 200,
      description: 'Inventario marcado como eliminado',
      schema: {
        example: {
          ok: true,
          status: 200,
          data: { message: 'Inventario eliminado exitosamente' },
          errors: [],
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Inventario no encontrado',
      schema: { example: ERROR_EXAMPLES.NOT_FOUND },
    }),
    ApiResponse({
      status: 422,
      description: 'Inventario con reservas activas o ya eliminado',
      schema: { example: ERROR_EXAMPLES.ESTADO_INVALIDO },
    }),
    ApiInventarioErrorResponses(),
  );
};

export const ApiRestaurarInventario = () => {
  return applyDecorators(
    ApiTags('Inventario - Operaciones'),
    ApiOperation({
      summary: 'Restaurar inventario eliminado',
      description:
        'Revierte soft delete marcando inventario como activo nuevamente. ' +
        'Solo funciona si el inventario está en estado eliminado (deleted=true). ' +
        'Emite evento InventarioRestaurado para auditoría.',
    }),
    ApiParam({
      name: 'inventarioId',
      type: String,
      description: 'ID del inventario a restaurar (UUID v7)',
    }),
    ApiResponse({
      status: 200,
      description: 'Inventario restaurado exitosamente',
      schema: {
        example: {
          ok: true,
          status: 200,
          data: { message: 'Inventario restaurado exitosamente' },
          errors: [],
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Inventario no encontrado (incluso buscando eliminados)',
      schema: { example: ERROR_EXAMPLES.NOT_FOUND },
    }),
    ApiResponse({
      status: 422,
      description: 'Inventario no está eliminado (no se puede restaurar)',
      schema: { example: ERROR_EXAMPLES.ESTADO_INVALIDO },
    }),
    ApiInventarioErrorResponses(),
  );
};
