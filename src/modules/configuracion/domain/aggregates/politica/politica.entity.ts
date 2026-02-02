/**
 * Politica Aggregate Root
 *
 * Manages policy lifecycle: BORRADOR → VIGENTE → ARCHIVADA.
 * Enforces single active (VIGENTE) policy per type (application layer ensures this).
 * Immutable after creation; state transitions tracked via events.
 */

import { IdGenerator } from '@shared/domain/factories';
import {
  CrearPoliticaProps,
  EstadoPolitica,
  EstadoPoliticaEnum,
  PoliticaData,
  PublicarPoliticaProps,
  TipoPolitica,
} from '../configuracion.types';
import {
  PoliticaArchivada,
  PoliticaCreada,
  PoliticaPublicada,
} from '../../events/configuracion.events';

export class Politica {
  private readonly eventos: (
    | PoliticaCreada
    | PoliticaPublicada
    | PoliticaArchivada
  )[] = [];

  /**
   * Private constructor. Use crear() or desde() factory methods.
   */
  private constructor(
    private readonly id: string,
    private readonly tipo: TipoPolitica,
    private readonly version: string,
    private readonly contenido: string,
    private estado: EstadoPolitica,
    private fechaVigenciaDesde: Date | undefined,
    private fechaVigenciaHasta: Date | undefined,
    private readonly publicadoPorId: string | undefined,
    private readonly fechaCreacion: Date,
  ) {
    Object.freeze(this);
  }

  /**
   * Factory: Create new Politica in BORRADOR state.
   *
   * Validates non-empty content.
   * Emits PoliticaCreada event for auditability.
   */
  static crear(params: CrearPoliticaProps): Politica {
    const id = IdGenerator.generate();

    // Validar contenido
    if (!params.contenido || params.contenido.trim().length === 0) {
      throw new Error('Contenido de política no puede estar vacío');
    }

    const politica = new Politica(
      id,
      params.tipo,
      params.version,
      params.contenido,
      EstadoPoliticaEnum.BORRADOR,
      undefined,
      undefined,
      params.publicadoPorId,
      new Date(),
    );

    // Emitir evento
    politica.eventos.push(new PoliticaCreada(id, params.tipo, params.version));

    return politica;
  }

  /**
   * Factory: Reconstruct from persisted data without emitting events.
   *
   * Used by repository when loading from database.
   * Events are NOT emitted here; only crear() emits.
   */
  static desde(data: PoliticaData): Politica {
    return new Politica(
      data.id,
      data.tipo,
      data.version,
      data.contenido,
      data.estado,
      data.fechaVigenciaDesde,
      data.fechaVigenciaHasta,
      data.publicadoPorId,
      data.fechaCreacion,
    );
  }

  /**
   * Publish policy: BORRADOR → VIGENTE.
   *
   * Precondition: state must be BORRADOR.
   * Emits PoliticaPublicada with effectiveness date.
   * Note: Application service handles archiving previous policies of same type.
   */
  publicar(params: PublicarPoliticaProps): void {
    // Precondición: debe estar en BORRADOR
    if (this.estado !== EstadoPoliticaEnum.BORRADOR) {
      throw new Error(
        `No se puede publicar política en estado ${this.estado}. Solo BORRADOR puede publicarse.`,
      );
    }

    const ahora = new Date();
    (this as any).estado = EstadoPoliticaEnum.VIGENTE;
    (this as any).fechaVigenciaDesde = params.fechaVigenciaDesde || ahora;

    // Emitir evento
    this.eventos.push(
      new PoliticaPublicada(
        this.id,
        this.tipo,
        this.version,
        this.fechaVigenciaDesde!,
      ),
    );
  }

  /**
   * Archive policy: any → ARCHIVADA.
   *
   * Precondition: state cannot already be ARCHIVADA.
   * Emits PoliticaArchivada marking end of validity period.
   */
  archivar(fechaVigenciaHasta?: Date): void {
    // Precondición: no puede estar ARCHIVADA
    if (this.estado === EstadoPoliticaEnum.ARCHIVADA) {
      throw new Error(
        'Política ya está ARCHIVADA, no se puede archivar nuevamente.',
      );
    }

    (this as any).estado = EstadoPoliticaEnum.ARCHIVADA;
    (this as any).fechaVigenciaHasta = fechaVigenciaHasta || new Date();

    // Emitir evento
    this.eventos.push(new PoliticaArchivada(this.id, this.tipo, this.version));
  }

  /**
   * Query: Determine if policy is active (VIGENTE) at given date.
   *
   * Checks: state is VIGENTE AND date is within [desde, hasta] range.
   * Used to validate which policy applies at a specific point in time.
   */
  estaVigenteEn(fecha: Date = new Date()): boolean {
    // Debe estar en estado VIGENTE
    if (this.estado !== EstadoPoliticaEnum.VIGENTE) {
      return false;
    }

    // Debe haber iniciado vigencia
    if (this.fechaVigenciaDesde && fecha < this.fechaVigenciaDesde) {
      return false;
    }

    // No debe haber expirado vigencia
    if (this.fechaVigenciaHasta && fecha >= this.fechaVigenciaHasta) {
      return false;
    }

    return true;
  }

  // ======================= GETTERS =======================

  getId(): string {
    return this.id;
  }

  getTipo(): TipoPolitica {
    return this.tipo;
  }

  getVersion(): string {
    return this.version;
  }

  getContenido(): string {
    return this.contenido;
  }

  getEstado(): EstadoPolitica {
    return this.estado;
  }

  getFechaVigenciaDesde(): Date | undefined {
    return this.fechaVigenciaDesde;
  }

  getFechaVigenciaHasta(): Date | undefined {
    return this.fechaVigenciaHasta;
  }

  getPublicadoPorId(): string | undefined {
    return this.publicadoPorId;
  }

  getFechaCreacion(): Date {
    return this.fechaCreacion;
  }

  /**
   * Returns defensive copy of emitted events.
   * Caller cannot modify internal state via this reference.
   */
  getEventos(): (PoliticaCreada | PoliticaPublicada | PoliticaArchivada)[] {
    return [...this.eventos];
  }

  /**
   * Clear events after persistence.
   * Called by repository after saving to prevent duplicate event handling.
   */
  vaciarEventos(): void {
    (this as any).eventos.length = 0;
  }
}
