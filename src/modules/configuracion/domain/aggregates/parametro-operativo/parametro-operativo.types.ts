import { TipoDatoEnum } from '../configuracion.types';

export interface ParametroOperativoData {
  readonly id: string;
  readonly clave: string;
  readonly nombre: string;
  readonly descripcion?: string;
  readonly tipoDato: TipoDatoEnum;
  readonly valor: string;
  readonly valorDefecto: string;
  readonly valorMinimo?: string;
  readonly valorMaximo?: string;
  readonly requiereReinicio: boolean;
  readonly modificadoPorId?: string;
  readonly fechaModificacion: Date;
}
