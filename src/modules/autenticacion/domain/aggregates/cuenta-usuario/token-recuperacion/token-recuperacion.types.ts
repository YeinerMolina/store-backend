import { TipoTokenRecuperacion, EstadoToken } from '../types';

export interface CrearTokenRecuperacionProps {
  cuentaUsuarioId: string;
  tipoToken: TipoTokenRecuperacion;
  tokenHash: string;
  fechaExpiracion: Date;
  ipSolicitud?: string;
}

export interface TokenRecuperacionProps {
  id: string;
  cuentaUsuarioId: string;
  tipoToken: TipoTokenRecuperacion;
  tokenHash: string;
  estado: EstadoToken;
  fechaCreacion: Date;
  fechaExpiracion: Date;
  fechaUso: Date | null;
  ipSolicitud: string | null;
  ipUso: string | null;
}

export interface TokenRecuperacionData {
  readonly id: string;
  readonly cuentaUsuarioId: string;
  readonly tipoToken: TipoTokenRecuperacion;
  readonly estado: EstadoToken;
  readonly fechaCreacion: Date;
  readonly fechaExpiracion: Date;
  readonly fechaUso: Date | null;
}

export interface OpcionesUsoToken {
  ipUso?: string;
}
