/**
 * SCHEMAS DE VALIDACIÓN CON ZOD - MÓDULO INVENTARIO
 *
 * Schemas centralizados para todos los DTOs del módulo INVENTARIO
 *
 * CONVENCIÓN:
 * - Nombre: {DTO}Schema
 * - Export: Named exports
 * - Tipos inferidos: export type {DTO} = z.infer<typeof {DTO}Schema>
 *
 * VENTAJAS:
 * - Single source of truth para validaciones
 * - Type-safety automático
 * - Reutilización fácil
 * - Composición de schemas
 */

import { z } from 'zod';
import {
  UUIDSchema,
  PositiveIntSchema,
  NonNegativeIntSchema,
  StringWithLength,
  createEnumSchema,
} from '../../../../shared/validation/common.schemas';

// ============================================================================
// SCHEMAS BASE (Específicos de Inventario)
// ============================================================================

/**
 * Cantidad positiva (alias para claridad)
 */
const CantidadPositivaSchema = PositiveIntSchema;

/**
 * Tipo de Item (PRODUCTO | PAQUETE)
 */
const TipoItemSchema = z.enum(['PRODUCTO', 'PAQUETE'], {
  message: 'Debe ser PRODUCTO o PAQUETE',
});

/**
 * Tipo de Operación (VENTA | CAMBIO | AJUSTE)
 */
const TipoOperacionSchema = z.enum(['VENTA', 'CAMBIO', 'AJUSTE'], {
  message: 'Debe ser VENTA, CAMBIO o AJUSTE',
});

/**
 * Tipo de Actor (EMPLEADO | CLIENTE | SISTEMA)
 */
const TipoActorSchema = z.enum(['EMPLEADO', 'CLIENTE', 'SISTEMA'], {
  message: 'Debe ser EMPLEADO, CLIENTE o SISTEMA',
});

/**
 * Estado de Reserva
 */
const EstadoReservaSchema = z.enum(
  ['ACTIVA', 'CONSOLIDADA', 'LIBERADA', 'EXPIRADA'],
  {
    message: 'Debe ser ACTIVA, CONSOLIDADA, LIBERADA o EXPIRADA',
  },
);

// ============================================================================
// REQUEST SCHEMAS
// ============================================================================

/**
 * Schema para reservar inventario
 *
 * Endpoint: POST /inventario/reservar
 */
export const ReservarInventarioSchema = z.object({
  tipoItem: TipoItemSchema,
  itemId: UUIDSchema,
  cantidad: CantidadPositivaSchema,
  operacionId: UUIDSchema,
  tipoOperacion: TipoOperacionSchema,
  actorTipo: TipoActorSchema,
  actorId: UUIDSchema,
});

export type ReservarInventarioDto = z.infer<typeof ReservarInventarioSchema>;

/**
 * Schema para consolidar reserva
 *
 * Endpoint: POST /inventario/consolidar
 *
 * NOTA: El servicio busca la reserva por operacionId
 */
export const ConsolidarReservaSchema = z.object({
  reservaId: UUIDSchema, // Requerido por el DTO antiguo (aunque no se usa)
  operacionId: UUIDSchema,
});

export type ConsolidarReservaDto = z.infer<typeof ConsolidarReservaSchema>;

/**
 * Schema para ajustar inventario
 *
 * Endpoint: POST /inventario/ajustar
 */
export const AjustarInventarioSchema = z.object({
  inventarioId: UUIDSchema,
  cantidad: z
    .number()
    .int({ message: 'Debe ser un número entero' })
    .refine((val) => val !== 0, {
      message: 'La cantidad no puede ser 0',
    }),
  empleadoId: UUIDSchema,
  intencion: z
    .string()
    .min(3, { message: 'Mínimo 3 caracteres' })
    .max(200, { message: 'Máximo 200 caracteres' }),
  notas: z.string().max(1000, { message: 'Máximo 1000 caracteres' }).optional(),
});

export type AjustarInventarioDto = z.infer<typeof AjustarInventarioSchema>;

/**
 * Schema para consultar disponibilidad
 *
 * Endpoint: GET /inventario/disponibilidad?tipoItem=PRODUCTO&itemId=...&cantidad=5
 *
 * NOTA: Los query params llegan como strings, por eso usamos coerce
 */
export const ConsultarDisponibilidadSchema = z.object({
  tipoItem: TipoItemSchema,
  itemId: UUIDSchema,
  cantidad: z.coerce.number().int().positive(),
});

export type ConsultarDisponibilidadDto = z.infer<
  typeof ConsultarDisponibilidadSchema
>;

// ============================================================================
// RESPONSE SCHEMAS (Opcional - para documentación)
// ============================================================================

/**
 * Schema de respuesta para Reserva
 */
export const ReservaResponseSchema = z.object({
  id: UUIDSchema,
  inventarioId: UUIDSchema,
  cantidad: z.number().int().positive(),
  estado: EstadoReservaSchema,
  fechaCreacion: z.string().datetime(),
  fechaExpiracion: z.string().datetime(),
  tipoOperacion: TipoOperacionSchema,
  operacionId: UUIDSchema,
});

export type ReservaResponseDto = z.infer<typeof ReservaResponseSchema>;

/**
 * Schema de respuesta para Disponibilidad
 */
export const DisponibilidadResponseSchema = z.object({
  disponible: z.boolean(),
  cantidadDisponible: z.number().int().nonnegative(),
  cantidadSolicitada: z.number().int().positive(),
  mensaje: z.string(),
});

export type DisponibilidadResponseDto = z.infer<
  typeof DisponibilidadResponseSchema
>;

/**
 * Schema de respuesta para Inventario
 */
export const InventarioResponseSchema = z.object({
  id: UUIDSchema,
  tipoItem: TipoItemSchema,
  itemId: UUIDSchema,
  cantidadDisponible: z.number().int().nonnegative(),
  cantidadReservada: z.number().int().nonnegative(),
  cantidadAbandono: z.number().int().nonnegative(),
  ubicacion: z.string().optional(),
  version: z.number().int().positive(),
});

export type InventarioResponseDto = z.infer<typeof InventarioResponseSchema>;
