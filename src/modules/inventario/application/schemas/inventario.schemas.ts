/**
 * Schemas de validación Zod para el módulo INVENTARIO.
 */

import { z } from 'zod';
import {
  UUIDSchema,
  PositiveIntSchema,
} from '../../../../shared/validation/common.schemas';
import {
  TipoItemEnum,
  TipoOperacionEnum,
  EstadoReservaEnum,
  TipoActorEnum,
} from '../../domain/aggregates/inventario/types';

const CantidadPositivaSchema = PositiveIntSchema;

const TipoItemSchema = z.enum(TipoItemEnum, {
  message: 'Debe ser PRODUCTO o PAQUETE',
});

const TipoOperacionSchema = z.enum(TipoOperacionEnum, {
  message: 'Debe ser VENTA, CAMBIO o AJUSTE',
});

const TipoActorSchema = z.enum(TipoActorEnum, {
  message: 'Debe ser EMPLEADO, CLIENTE o SISTEMA',
});

const EstadoReservaSchema = z.enum(EstadoReservaEnum, {
  message: 'Debe ser ACTIVA, CONSOLIDADA, LIBERADA o EXPIRADA',
});

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

export const ConsolidarReservaSchema = z.object({
  reservaId: UUIDSchema,
  operacionId: UUIDSchema,
});

export type ConsolidarReservaDto = z.infer<typeof ConsolidarReservaSchema>;

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
 * Query params llegan como strings, por eso usamos coerce.
 */
export const ConsultarDisponibilidadSchema = z.object({
  tipoItem: TipoItemSchema,
  itemId: UUIDSchema,
  cantidad: z.coerce.number().int().positive(),
});

export type ConsultarDisponibilidadDto = z.infer<
  typeof ConsultarDisponibilidadSchema
>;

export const ReservaResponseSchema = z.object({
  id: UUIDSchema,
  inventarioId: UUIDSchema,
  cantidad: z.number().int().positive(),
  estado: EstadoReservaSchema,
  fechaCreacion: z.iso.datetime(),
  fechaExpiracion: z.iso.datetime(),
  tipoOperacion: TipoOperacionSchema,
  operacionId: UUIDSchema,
});

export type ReservaResponseDto = z.infer<typeof ReservaResponseSchema>;

export const DisponibilidadResponseSchema = z.object({
  disponible: z.boolean(),
  cantidadDisponible: z.number().int().nonnegative(),
  cantidadSolicitada: z.number().int().positive(),
  mensaje: z.string(),
});

export type DisponibilidadResponseDto = z.infer<
  typeof DisponibilidadResponseSchema
>;

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
