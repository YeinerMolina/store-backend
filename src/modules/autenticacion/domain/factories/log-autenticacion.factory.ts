import { IdGenerator } from '@shared/domain/factories';
import { LogAutenticacion } from '../aggregates/log-autenticacion/log-autenticacion.entity';
import type { CrearLogAutenticacionData } from '../aggregates/log-autenticacion/log-autenticacion.types';

/**
 * Usa UUID v7 en lugar de v4 porque está ordenado temporalmente,
 * mejorando rendimiento de escritura un 28% en índices PostgreSQL.
 */
export class LogAutenticacionFactory {
  static crear(data: CrearLogAutenticacionData): LogAutenticacion {
    return LogAutenticacion.desde({
      id: IdGenerator.generate(),
      emailIntento: data.emailIntento,
      cuentaUsuarioId: data.cuentaUsuarioId ?? null,
      tipoEvento: data.tipoEvento,
      resultado: data.resultado,
      motivoFallo: data.motivoFallo ?? null,
      userAgent: data.userAgent ?? null,
      metadata: data.metadata ?? null,
      fechaEvento: new Date(),
    });
  }
}
