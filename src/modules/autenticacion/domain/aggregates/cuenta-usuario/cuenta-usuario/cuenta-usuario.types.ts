import { TipoUsuario, EstadoCuenta } from '../types';

export interface CrearCuentaUsuarioProps {
  email: string;
  passwordHash: string;
  tipoUsuario: TipoUsuario;
  clienteId?: string;
  empleadoId?: string;
  emailVerificado?: boolean;
  estado?: EstadoCuenta;
}

export interface CuentaUsuarioProps {
  id: string;
  email: string;
  passwordHash: string;
  tipoUsuario: TipoUsuario;
  clienteId: string | null;
  empleadoId: string | null;
  estado: EstadoCuenta;
  emailVerificado: boolean;
  intentosFallidos: number;
  bloqueadoHasta: Date | null;
  ultimoLogin: Date | null;
  ultimoCambioPassword: Date | null;
  fechaCreacion: Date;
  fechaModificacion: Date;
}

export interface CuentaUsuarioData {
  readonly id: string;
  readonly email: string;
  readonly tipoUsuario: TipoUsuario;
  readonly clienteId: string | null;
  readonly empleadoId: string | null;
  readonly estado: EstadoCuenta;
  readonly emailVerificado: boolean;
  readonly intentosFallidos: number;
  readonly bloqueadoHasta: Date | null;
  readonly ultimoLogin: Date | null;
  readonly ultimoCambioPassword: Date | null;
  readonly fechaCreacion: Date;
  readonly fechaModificacion: Date;
}

export interface ResultadoAutenticacion {
  exito: boolean;
  motivoFallo?: string;
  requiereCambioPassword?: boolean;
}

export interface OpcionesBloqueo {
  numeroBloqueo: number;
  minutosBloqueoInicial: number;
}
