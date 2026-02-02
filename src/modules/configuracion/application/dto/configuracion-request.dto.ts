/**
 * DTOs de Solicitud - Módulo CONFIGURACIÓN
 *
 * Estos DTOs representan los datos que recibimos del cliente (HTTP/API).
 * Usan tipos primitivos (string, number) que se mapean a tipos del dominio.
 *
 * Validación: Cada DTO tiene un Schema Zod correspondiente en configuracion.schema.ts
 */

/**
 * DTO: Crear Parámetro Operativo
 *
 * Recibido del cliente como JSON en POST /configuracion/parametros
 *
 * Ejemplo:
 * {
 *   "clave": "DURACION_RESERVA_VENTA",
 *   "nombre": "Duración de Reserva para Venta",
 *   "descripcion": "Tiempo máximo para completar una venta online",
 *   "tipoDato": "DURACION",
 *   "valor": "20 minutes",
 *   "valorDefecto": "20 minutes",
 *   "valorMinimo": "1 minutes",
 *   "valorMaximo": "60 minutes",
 *   "requiereReinicio": false
 * }
 */
export class CrearParametroOperativoRequestDto {
  /** Identificador único del parámetro (ej: DURACION_RESERVA_VENTA) */
  clave!: string;

  /** Nombre descriptivo para UI */
  nombre!: string;

  /** Documentación opcional del parámetro */
  descripcion?: string;

  /** Tipo de validación: ENTERO, DECIMAL, BOOLEAN, TEXTO, DURACION */
  tipoDato!: string;

  /** Valor actual */
  valor!: string;

  /** Valor por defecto */
  valorDefecto!: string;

  /** Límite inferior (opcional, solo para ENTERO/DECIMAL) */
  valorMinimo?: string;

  /** Límite superior (opcional, solo para ENTERO/DECIMAL) */
  valorMaximo?: string;

  /** Si true, cambios requieren reinicio de la app */
  requiereReinicio?: boolean;
}

/**
 * DTO: Actualizar Parámetro Operativo
 *
 * Recibido del cliente como JSON en PATCH /configuracion/parametros/:id
 *
 * Ejemplo:
 * {
 *   "valor": "30 minutes"
 * }
 */
export class ActualizarParametroOperativoRequestDto {
  /** Nuevo valor del parámetro */
  valor!: string;
}

/**
 * DTO: Crear Política
 *
 * Recibido del cliente como JSON en POST /configuracion/politicas
 * Crea en estado BORRADOR. Luego se publica con endpoint separado.
 *
 * Ejemplo:
 * {
 *   "tipo": "CAMBIOS",
 *   "version": "2.1.0",
 *   "contenido": "Lorem ipsum dolor sit amet... (texto completo de política)"
 * }
 */
export class CrearPoliticaRequestDto {
  /** Tipo de política: CAMBIOS, ENVIOS, TERMINOS */
  tipo!: string;

  /** Versión de la política (ej: 1.0.0, 2.1.5) */
  version!: string;

  /** Texto completo de la política */
  contenido!: string;
}

/**
 * DTO: Publicar Política
 *
 * Recibido del cliente como JSON en PATCH /configuracion/politicas/:id/publicar
 * Transiciona de BORRADOR a VIGENTE
 *
 * Ejemplo:
 * {
 *   "fechaVigenciaDesde": "2026-02-10T00:00:00Z"
 * }
 */
export class PublicarPoliticaRequestDto {
  /** Fecha desde la cual la política comienza a ser vigente (opcional, default: ahora) */
  fechaVigenciaDesde?: Date;
}
