import { EstadoPoliticaEnum, TipoPoliticaEnum } from '../configuracion.types';

export interface PoliticaData {
  readonly id: string;
  readonly tipo: TipoPoliticaEnum;
  readonly version: string;
  readonly contenido: string;
  readonly estado: EstadoPoliticaEnum;
  readonly fechaVigenciaDesde?: Date;
  readonly fechaVigenciaHasta?: Date;
  readonly publicadoPorId?: string;
  readonly fechaCreacion: Date;
}
