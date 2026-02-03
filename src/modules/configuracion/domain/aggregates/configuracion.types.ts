export const TipoDatoEnum = {
  ENTERO: 'ENTERO',
  DECIMAL: 'DECIMAL',
  BOOLEAN: 'BOOLEAN',
  TEXTO: 'TEXTO',
  DURACION: 'DURACION',
} as const;

export type TipoDato = (typeof TipoDatoEnum)[keyof typeof TipoDatoEnum];

export const TipoPoliticaEnum = {
  CAMBIOS: 'CAMBIOS',
  ENVIOS: 'ENVIOS',
  TERMINOS: 'TERMINOS',
} as const;

export type TipoPolitica =
  (typeof TipoPoliticaEnum)[keyof typeof TipoPoliticaEnum];

export const EstadoPoliticaEnum = {
  BORRADOR: 'BORRADOR',
  VIGENTE: 'VIGENTE',
  ARCHIVADA: 'ARCHIVADA',
} as const;

export type EstadoPolitica =
  (typeof EstadoPoliticaEnum)[keyof typeof EstadoPoliticaEnum];

/**
 * Permite validación type-safe eliminando uso de `any` en mappers.
 */
export function isTipoDato(value: unknown): value is TipoDato {
  return (
    typeof value === 'string' &&
    Object.values(TipoDatoEnum).includes(value as TipoDato)
  );
}

export function isTipoPolitica(value: unknown): value is TipoPolitica {
  return (
    typeof value === 'string' &&
    Object.values(TipoPoliticaEnum).includes(value as TipoPolitica)
  );
}

export function isEstadoPolitica(value: unknown): value is EstadoPolitica {
  return (
    typeof value === 'string' &&
    Object.values(EstadoPoliticaEnum).includes(value as EstadoPolitica)
  );
}

export interface CrearParametroOperativoProps {
  readonly clave: string;
  readonly nombre: string;
  readonly descripcion?: string;
  readonly tipoDato: TipoDato;
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

/**
 * Reconstruye agregados desde BD sin emitir eventos.
 */
export interface ParametroOperativoData {
  readonly id: string;
  readonly clave: string;
  readonly nombre: string;
  readonly descripcion?: string;
  readonly tipoDato: TipoDato;
  readonly valor: string;
  readonly valorDefecto: string;
  readonly valorMinimo?: string;
  readonly valorMaximo?: string;
  readonly requiereReinicio: boolean;
  readonly modificadoPorId?: string;
  readonly fechaModificacion: Date;
}

export interface CrearPoliticaProps {
  readonly tipo: TipoPolitica;
  readonly version: string;
  readonly contenido: string;
  readonly publicadoPorId?: string;
}

export interface PublicarPoliticaProps {
  readonly fechaVigenciaDesde?: Date;
  readonly publicadoPorId?: string;
}

/**
 * Reconstruye agregados desde BD sin emitir eventos.
 */
export interface PoliticaData {
  readonly id: string;
  readonly tipo: TipoPolitica;
  readonly version: string;
  readonly contenido: string;
  readonly estado: EstadoPolitica;
  readonly fechaVigenciaDesde?: Date;
  readonly fechaVigenciaHasta?: Date;
  readonly publicadoPorId?: string;
  readonly fechaCreacion: Date;
}
