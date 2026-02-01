import { z } from 'zod';
import { TipoItemEnum } from '@inventario/domain/aggregates/inventario';

export const crearInventarioRequestSchema = z.object({
  tipoItem: z.enum(TipoItemEnum, {
    error: 'TipoItem debe ser PRODUCTO o PAQUETE',
  }),
  itemId: z.uuid({ error: 'itemId debe ser un UUID válido' }),
  ubicacion: z.string().min(1).max(100).optional(),
  cantidadInicial: z
    .number({ error: 'cantidadInicial debe ser un número' })
    .int({ error: 'cantidadInicial debe ser un número entero' })
    .min(0, { error: 'cantidadInicial no puede ser negativa' }),
  empleadoId: z.uuid({ error: 'empleadoId debe ser un UUID válido' }),
  notas: z.string().max(500).optional(),
});

export type CrearInventarioRequestDto = z.infer<
  typeof crearInventarioRequestSchema
>;
