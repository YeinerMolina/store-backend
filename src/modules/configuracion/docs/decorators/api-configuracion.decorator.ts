import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  ParametroOperativoResponseDto,
  PoliticaResponseDto,
} from '../../application/dto/configuracion-response.dto';

/**
 * POST /configuracion/parametros
 * Create a new operating parameter.
 */
export function ApiCrearParametroOperativo() {
  return applyDecorators(
    ApiOperation({
      summary: 'Crear parámetro operativo',
      description:
        'Crea un nuevo parámetro operativo. Clave debe ser única (MAYÚSCULAS_CON_GUIONES).',
    }),
    ApiCreatedResponse({
      description: 'Parámetro creado exitosamente',
      type: ParametroOperativoResponseDto,
    }),
    ApiBadRequestResponse({
      description:
        'Validación fallida: clave inválida, tipo_dato no reconocido, valor fuera de rango',
    }),
    ApiConflictResponse({
      description: 'Clave ya existe',
    }),
  );
}

/**
 * PATCH /configuracion/parametros/:id
 * Update parameter value.
 * NOTE: modificadoPorId is tracked internally via authentication context.
 */
export function ApiActualizarParametroOperativo() {
  return applyDecorators(
    ApiOperation({
      summary: 'Actualizar valor de parámetro',
      description:
        'Actualiza el valor de un parámetro existente. Valida según tipo_dato y rangos. El usuario que modifica se obtiene del contexto de autenticación.',
    }),
    ApiOkResponse({
      description: 'Parámetro actualizado exitosamente',
      type: ParametroOperativoResponseDto,
    }),
    ApiBadRequestResponse({
      description: 'Validación fallida: nuevo valor inválido o fuera de rango',
    }),
    ApiNotFoundResponse({
      description: 'Parámetro no encontrado',
    }),
  );
}

/**
 * GET /configuracion/parametros/:id
 * Get parameter by ID.
 */
export function ApiObtenerParametroOperativo() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener parámetro por ID',
      description: 'Retorna datos completos del parámetro especificado.',
    }),
    ApiOkResponse({
      description: 'Parámetro encontrado',
      type: ParametroOperativoResponseDto,
    }),
    ApiNotFoundResponse({
      description: 'Parámetro no encontrado',
    }),
  );
}

/**
 * GET /configuracion/parametros/clave/:clave
 * Get parameter by clave (natural identifier).
 */
export function ApiObtenerParametroPorClave() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener parámetro por clave',
      description:
        'Retorna parámetro usando su identificador natural (clave). Este es el lookup más eficiente.',
    }),
    ApiOkResponse({
      description: 'Parámetro encontrado',
      type: ParametroOperativoResponseDto,
    }),
    ApiNotFoundResponse({
      description: 'Parámetro no encontrado',
    }),
  );
}

/**
 * GET /configuracion/parametros
 * List all parameters.
 */
export function ApiListarParametros() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar todos los parámetros',
      description:
        'Retorna lista completa de parámetros operativos sin paginación.',
    }),
    ApiOkResponse({
      description: 'Lista de parámetros',
      isArray: true,
      type: ParametroOperativoResponseDto,
    }),
  );
}

/**
 * POST /configuracion/politicas
 * Create new policy in BORRADOR state.
 */
export function ApiCrearPolitica() {
  return applyDecorators(
    ApiOperation({
      summary: 'Crear nueva versión de política',
      description:
        'Crea una nueva política en estado BORRADOR. Versión debe ser semántica (1.0.0). Luego publicar con endpoint separado.',
    }),
    ApiCreatedResponse({
      description: 'Política creada en estado BORRADOR',
      type: PoliticaResponseDto,
    }),
    ApiBadRequestResponse({
      description:
        'Validación fallida: tipo inválido, versión no semántica, contenido vacío',
    }),
    ApiConflictResponse({
      description: 'Política de este tipo y versión ya existe',
    }),
  );
}

/**
 * PATCH /configuracion/politicas/:id/publicar
 * Publish policy: BORRADOR → VIGENTE.
 * Automatically archives previous VIGENTE policy of same type.
 * NOTE: publicadoPorId is tracked internally via authentication context.
 */
export function ApiPublicarPolitica() {
  return applyDecorators(
    ApiOperation({
      summary: 'Publicar política (BORRADOR → VIGENTE)',
      description:
        'Transiciona política a estado VIGENTE. Automáticamente archiva política anterior del mismo tipo. El usuario que publica se obtiene del contexto de autenticación.',
    }),
    ApiOkResponse({
      description: 'Política publicada exitosamente',
      type: PoliticaResponseDto,
    }),
    ApiBadRequestResponse({
      description:
        'Validación fallida: fecha inválida o política no está en estado BORRADOR',
    }),
    ApiNotFoundResponse({
      description: 'Política no encontrada',
    }),
  );
}

/**
 * GET /configuracion/politicas/:id
 * Get policy by ID.
 */
export function ApiObtenerPolitica() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener política por ID',
      description:
        'Retorna datos completos de la política especificada (cualquier estado).',
    }),
    ApiOkResponse({
      description: 'Política encontrada',
      type: PoliticaResponseDto,
    }),
    ApiNotFoundResponse({
      description: 'Política no encontrada',
    }),
  );
}

/**
 * GET /configuracion/politicas/vigente/:tipo
 * Get currently active (VIGENTE) policy for given type.
 */
export function ApiObtenerPoliticaVigente() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener política vigente por tipo',
      description:
        'Retorna la política VIGENTE actualmente aplicable del tipo especificado. Null si no hay activa.',
    }),
    ApiOkResponse({
      description: 'Política vigente encontrada',
      type: PoliticaResponseDto,
      isArray: false,
    }),
    ApiNotFoundResponse({
      description: 'No hay política vigente de este tipo',
    }),
  );
}

/**
 * GET /configuracion/politicas
 * List all policies (optional type filter).
 */
export function ApiListarPoliticas() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar todas las políticas',
      description:
        'Retorna lista de políticas en todos los estados (BORRADOR, VIGENTE, ARCHIVADA). Filtrado por tipo opcional.',
    }),
    ApiOkResponse({
      description: 'Lista de políticas',
      isArray: true,
      type: PoliticaResponseDto,
    }),
  );
}
