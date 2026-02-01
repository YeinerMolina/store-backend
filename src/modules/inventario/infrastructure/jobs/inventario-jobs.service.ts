import { Injectable, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { InventarioService } from '../../domain/ports/inbound/inventario.service';
import { INVENTARIO_SERVICE_TOKEN } from '../../domain/ports/tokens';

@Injectable()
export class InventarioJobsService {
  constructor(
    @Inject(INVENTARIO_SERVICE_TOKEN)
    private readonly inventarioService: InventarioService,
  ) {}

  /**
   * Libera automáticamente todas las reservas expiradas.
   * Frecuencia: Cada minuto (cron: '* * * * *')
   * Razón: Las reservas expiran cada 20 minutos, hay que detectarlas rápido
   * Tolerancia a errores: Si falla una reserva, continúa con las demás
   */
  @Cron('* * * * *')
  async liberarReservasExpiradas() {
    try {
      await this.inventarioService.liberarReservasExpiradas();
      console.log('[JOB] Reservas expiradas liberadas');
    } catch (error) {
      console.error('[JOB ERROR] Liberar reservas:', error.message);
    }
  }

  /**
   * Detecta inventarios con stock bajo y emite notificaciones.
   * Frecuencia: Diariamente a las 8:00 AM (cron: '0 8 * * *')
   * Razón: No es crítico en tiempo real, una vez al día es suficiente
   * Tolerancia a errores: Si falla un inventario, continúa con los demás
   */
  @Cron('0 8 * * *')
  async detectarStockBajo() {
    try {
      const umbral = 10; // TODO: Leer de CONFIGURACION (Paso 4)
      await this.inventarioService.detectarStockBajo(umbral);
      console.log('[JOB] Stock bajo detectado');
    } catch (error) {
      console.error('[JOB ERROR] Detectar stock bajo:', error.message);
    }
  }
}
