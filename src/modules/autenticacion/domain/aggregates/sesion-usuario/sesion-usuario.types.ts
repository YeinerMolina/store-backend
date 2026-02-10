import { EstadoSesion } from '../types';

export interface CrearSesionUsuarioProps {
  cuentaUsuarioId: string;
  refreshTokenHash: string;
  dispositivo?: string;
  fechaExpiracion: Date;
}

export interface SesionUsuarioProps {
  id: string;
  cuentaUsuarioId: string;
  refreshTokenHash: string;
  dispositivo: string | null;
  estado: EstadoSesion;
  fechaCreacion: Date;
  fechaExpiracion: Date;
  fechaUltimoUso: Date | null;
  fechaRevocacion: Date | null;
  revocadaPor: string | null;
  motivoRevocacion: string | null;
}

export interface SesionUsuarioData {
  readonly id: string;
  readonly cuentaUsuarioId: string;
  readonly dispositivo: string | null;
  readonly estado: EstadoSesion;
  readonly fechaCreacion: Date;
  readonly fechaExpiracion: Date;
  readonly fechaUltimoUso: Date | null;
}

export interface OpcionesRevocacion {
  revocadaPor?: string;
  motivo: string;
}
