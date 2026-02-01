import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { InventarioService } from '../../domain/ports/inbound/inventario.service';
import { INVENTARIO_SERVICE_TOKEN } from '../../domain/ports/tokens';

@Injectable()
export class InventarioJobsService {
  private readonly logger = new Logger(InventarioJobsService.name);

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
      this.logger.log('Reservas expiradas liberadas');
    } catch (error: any) {
      this.logger.error('Liberar reservas falló', error.stack);
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
      await this.inventarioService.detectarStockBajo();
      this.logger.log('Stock bajo detectado');
    } catch (error: any) {
      this.logger.error('Detectar stock bajo falló', error.stack);
    }
  }
}
