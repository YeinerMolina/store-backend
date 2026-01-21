import { Injectable, Inject } from '@nestjs/common';
import type { InventarioService } from '../../domain/ports/inbound/inventario.service';

@Injectable()
export class InventarioJobsService {
  constructor(
    @Inject('INVENTARIO_SERVICE')
    private readonly inventarioService: InventarioService,
  ) {}

  // TODO: Agregar @Cron('* * * * *') cuando @nestjs/schedule esté instalado
  async liberarReservasExpiradas() {
    try {
      await this.inventarioService.liberarReservasExpiradas();
      console.log('[JOB] Reservas expiradas liberadas');
    } catch (error: any) {
      console.error('[JOB ERROR] Liberar reservas:', error.message);
    }
  }

  // TODO: Agregar @Cron('0 8 * * *') cuando @nestjs/schedule esté instalado
  async detectarStockBajo() {
    try {
      const umbral = 10; // TODO: Leer de CONFIGURACION
      await this.inventarioService.detectarStockBajo(umbral);
      console.log('[JOB] Stock bajo detectado');
    } catch (error: any) {
      console.error('[JOB ERROR] Detectar stock bajo:', error.message);
    }
  }
}
