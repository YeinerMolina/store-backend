import {
  ParametroOperativoActualizado,
  ParametroOperativoCreado,
  PoliticaArchivada,
  PoliticaCreada,
  PoliticaPublicada,
} from '../events';

export enum TipoDatoEnum {
  ENTERO = 'ENTERO',
  DECIMAL = 'DECIMAL',
  BOOLEAN = 'BOOLEAN',
}

export enum TipoPoliticaEnum {
  CAMBIOS = 'CAMBIOS',
  ENVIOS = 'ENVIOS',
  TERMINOS = 'TERMINOS',
}

export enum EstadoPoliticaEnum {
  BORRADOR = 'BORRADOR',
  VIGENTE = 'VIGENTE',
  ARCHIVADA = 'ARCHIVADA',
}

export interface CrearParametroOperativoProps {
  readonly clave: string;
  readonly nombre: string;
  readonly descripcion?: string;
  readonly tipoDato: TipoDatoEnum;
  readonly valor: string;
  readonly valorDefecto: string;
  readonly valorMinimo?: string;
  readonly valorMaximo?: string;
  readonly requiereReinicio?: boolean;
}

export interface ActualizarParametroOperativoProps {
  readonly valor: string;
  readonly modificadoPorId?: string;
}

export interface CrearPoliticaProps {
  readonly tipo: TipoPoliticaEnum;
  readonly version: string;
  readonly contenido: string;
  readonly publicadoPorId?: string;
}

export interface PublicarPoliticaProps {
  readonly fechaVigenciaDesde?: Date;
  readonly publicadoPorId?: string;
}

export type ParametroOperativoEvento =
  | ParametroOperativoCreado
  | ParametroOperativoActualizado;

export type PoliticaEvento =
  | PoliticaCreada
  | PoliticaPublicada
  | PoliticaArchivada;
