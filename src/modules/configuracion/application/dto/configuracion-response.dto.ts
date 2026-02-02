/**
 * DTOs de Respuesta - Módulo CONFIGURACIÓN
 *
 * Estos DTOs representan los datos que enviamos al cliente.
 * Se mapean desde ParametroOperativoData y PoliticaData del dominio.
 *
 * Mapper: Ver configuracion.mapper.ts
 */

/**
 * DTO: Respuesta de Parámetro Operativo
 *
 * Retornado del servidor en GET, POST, PATCH
 *
 * Ejemplo:
 * {
 *   "id": "550e8400-e29b-41d4-a716-446655440000",
 *   "clave": "DURACION_RESERVA_VENTA",
 *   "nombre": "Duración de Reserva para Venta",
 *   "descripcion": "Tiempo máximo para completar una venta online",
 *   "tipoDato": "DURACION",
 *   "valor": "20 minutes",
 *   "valorDefecto": "20 minutes",
 *   "valorMinimo": "1 minutes",
 *   "valorMaximo": "60 minutes",
 *   "requiereReinicio": false,
 *   "modificadoPorId": null,
 *   "fechaModificacion": "2026-02-02T14:30:00.000Z"
 * }
 */
export class ParametroOperativoResponseDto {
  /** UUID del parámetro */
  id!: string;

  /** Identificador único del parámetro */
  clave!: string;

  /** Nombre descriptivo */
  nombre!: string;

  /** Documentación */
  descripcion?: string;

  /** Tipo de validación */
  tipoDato!: string;

  /** Valor actual */
  valor!: string;

  /** Valor por defecto */
  valorDefecto!: string;

  /** Límite inferior (opcional) */
  valorMinimo?: string;

  /** Límite superior (opcional) */
  valorMaximo?: string;

  /** Si requiere reinicio de app */
  requiereReinicio!: boolean;

  /** UUID del empleado que modificó (nullable) */
  modificadoPorId?: string;

  /** ISO string de cuándo fue modificado */
  fechaModificacion!: string;
}

/**
 * DTO: Respuesta de Política
 *
 * Retornado del servidor en GET, POST, PATCH
 *
 * Ejemplo:
 * {
 *   "id": "660e8400-e29b-41d4-a716-446655440001",
 *   "tipo": "CAMBIOS",
 *   "version": "2.1.0",
 *   "contenido": "Lorem ipsum dolor sit amet... (texto completo)",
 *   "estado": "VIGENTE",
 *   "fechaVigenciaDesde": "2026-02-02T00:00:00.000Z",
 *   "fechaVigenciaHasta": null,
 *   "publicadoPorId": "550e8400-e29b-41d4-a716-446655440000",
 *   "fechaCreacion": "2026-01-30T10:00:00.000Z"
 * }
 */
export class PoliticaResponseDto {
  /** UUID de la política */
  id!: string;

  /** Tipo de política: CAMBIOS, ENVIOS, TERMINOS */
  tipo!: string;

  /** Versión de la política */
  version!: string;

  /** Texto completo de la política */
  contenido!: string;

  /** Estado: BORRADOR, VIGENTE, ARCHIVADA */
  estado!: string;

  /** Fecha desde la cual es vigente (ISO string, nullable) */
  fechaVigenciaDesde?: string;

  /** Fecha hasta la cual fue vigente (ISO string, nullable) */
  fechaVigenciaHasta?: string;

  /** UUID del empleado que publicó (nullable) */
  publicadoPorId?: string;

  /** ISO string de cuándo fue creada */
  fechaCreacion!: string;
}
