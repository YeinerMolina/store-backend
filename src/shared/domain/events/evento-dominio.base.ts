import { UUID } from '../value-objects/uuid.vo';

/**
 * Clase Base para Eventos de Dominio
 * Todos los eventos heredan de esta clase
 */
export abstract class EventoDominioBase {
  public readonly eventoId: UUID;
  public readonly ocurridoEn: Date;
  public readonly tipoEvento: string;

  constructor(tipoEvento: string) {
    this.eventoId = UUID.create();
    this.ocurridoEn = new Date();
    this.tipoEvento = tipoEvento;
  }

  abstract toPrimitives(): Record<string, any>;
}
