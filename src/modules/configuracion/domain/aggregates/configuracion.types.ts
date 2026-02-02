/**
 * Domain Types - CONFIGURACIÓN Module
 *
 * DTOs use primitive types (string, number) from HTTP layer.
 * Domain types use enums and business-specific validations.
 * This separation allows domain and persistence models to evolve independently.
 */

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
 * Used by repository to reconstruct aggregates from database.
 * Never emits events (only factory.desde() does).
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
 * Used by repository to reconstruct aggregates from database.
 * Never emits events (only factory.desde() does).
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
