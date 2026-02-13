import { VerificarEmailData } from '../../types';

/**
 * Puerto inbound para verificación de emails.
 */
export interface VerificacionEmailService {
  /**
   * Side effects:
   * - Marca email_verificado = true
   * - Cambia estado de PENDIENTE_VERIFICACION a ACTIVA
   * - Marca token como USADO
   */
  verificarEmail(data: VerificarEmailData): Promise<void>;
}
