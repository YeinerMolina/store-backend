import { z } from 'zod';
import {
  TipoItemEnum,
  TipoOperacionEnum,
  TipoActorEnum,
} from '@inventario/domain/aggregates/inventario';

export const reservarInventarioRequestSchema = z.object({
  tipoItem: z.enum(TipoItemEnum, {
    error: 'TipoItem debe ser PRODUCTO o PAQUETE',
  }),
  itemId: z.uuid({ error: 'itemId debe ser un UUID válido' }),
  cantidad: z
    .number({ error: 'cantidad debe ser un número' })
    .int({ error: 'cantidad debe ser un número entero' })
    .positive({ error: 'cantidad debe ser mayor a 0' }),
  operacionId: z.uuid({ error: 'operacionId debe ser un UUID válido' }),
  tipoOperacion: z.enum(TipoOperacionEnum, {
    error: 'tipoOperacion debe ser VENTA, CAMBIO o AJUSTE',
  }),
  actorTipo: z.enum(TipoActorEnum, {
    error: 'actorTipo debe ser SISTEMA, EMPLEADO o CLIENTE',
  }),
  actorId: z.uuid({ error: 'actorId debe ser un UUID válido' }),
});

export type ReservarInventarioRequestDto = z.infer<
  typeof reservarInventarioRequestSchema
>;
