import {
  TipoActorEnum,
  TipoOperacionEnum,
} from '@inventario/domain/aggregates/inventario';

export interface ReservarInventarioRequestDto {
  tipoItem: string;
  itemId: string;
  cantidad: number;
  operacionId: string;
  tipoOperacion: TipoOperacionEnum;
  actorTipo: TipoActorEnum;
  actorId: string;
}
