import { z } from 'zod';
import { TipoItemEnum } from '@inventario/domain/aggregates/inventario';

export const consultarDisponibilidadRequestSchema = z.object({
  tipoItem: z.enum(TipoItemEnum, {
    error: 'TipoItem debe ser PRODUCTO o PAQUETE',
  }),
  itemId: z.uuid({ error: 'itemId debe ser un UUID válido' }),
  cantidad: z
    .number({ error: 'cantidad debe ser un número' })
    .int({ error: 'cantidad debe ser un número entero' })
    .positive({ error: 'cantidad debe ser mayor a 0' }),
});

export type ConsultarDisponibilidadRequestDto = z.infer<
  typeof consultarDisponibilidadRequestSchema
>;
