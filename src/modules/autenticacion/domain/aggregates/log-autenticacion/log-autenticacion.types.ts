import type { TipoEventoAuth, ResultadoAuth } from '../types';

export interface LogAutenticacionProps {
  id: string;
  emailIntento: string;
  cuentaUsuarioId: string | null;
  tipoEvento: TipoEventoAuth;
  resultado: ResultadoAuth;
  motivoFallo: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  fechaEvento: Date;
}

export interface CrearLogAutenticacionData {
  emailIntento: string;
  cuentaUsuarioId?: string | null;
  tipoEvento: TipoEventoAuth;
  resultado: ResultadoAuth;
  motivoFallo?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}
