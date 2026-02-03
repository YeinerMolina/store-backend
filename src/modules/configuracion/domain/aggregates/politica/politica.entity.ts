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
   * Campos con prefijo _ son mutables internamente pero readonly externamente.
   */
  private constructor(
    private readonly id: string,
    private readonly tipo: TipoPolitica,
    private readonly version: string,
    private readonly contenido: string,
    private _estado: EstadoPolitica,
    private _fechaVigenciaDesde: Date | undefined,
    private _fechaVigenciaHasta: Date | undefined,
    private readonly publicadoPorId: string | undefined,
    private readonly fechaCreacion: Date,
  ) {
    Object.freeze(this);
  }

  static crear(params: CrearPoliticaProps): Politica {
    const id = IdGenerator.generate();

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

    politica.eventos.push(new PoliticaCreada(id, params.tipo, params.version));

    return politica;
  }

  /**
   * Reconstituye desde BD sin emitir eventos.
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
   * Application service se encarga de archivar políticas anteriores del mismo tipo.
   */
  publicar(params: PublicarPoliticaProps): void {
    if (this._estado !== EstadoPoliticaEnum.BORRADOR) {
      throw new Error(
        `No se puede publicar política en estado ${this._estado}. Solo BORRADOR puede publicarse.`,
      );
    }

    const ahora = new Date();
    this._estado = EstadoPoliticaEnum.VIGENTE;
    this._fechaVigenciaDesde = params.fechaVigenciaDesde || ahora;

    this.eventos.push(
      new PoliticaPublicada(
        this.id,
        this.tipo,
        this.version,
        this._fechaVigenciaDesde!,
      ),
    );
  }

  archivar(fechaVigenciaHasta?: Date): void {
    if (this._estado === EstadoPoliticaEnum.ARCHIVADA) {
      throw new Error(
        'Política ya está ARCHIVADA, no se puede archivar nuevamente.',
      );
    }

    this._estado = EstadoPoliticaEnum.ARCHIVADA;
    this._fechaVigenciaHasta = fechaVigenciaHasta || new Date();

    this.eventos.push(new PoliticaArchivada(this.id, this.tipo, this.version));
  }

  /**
   * Verifica si política está VIGENTE en la fecha dada (dentro del rango [desde, hasta]).
   */
  estaVigenteEn(fecha: Date = new Date()): boolean {
    if (this._estado !== EstadoPoliticaEnum.VIGENTE) {
      return false;
    }

    if (this._fechaVigenciaDesde && fecha < this._fechaVigenciaDesde) {
      return false;
    }

    if (this._fechaVigenciaHasta && fecha >= this._fechaVigenciaHasta) {
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
    return this._estado;
  }

  getFechaVigenciaDesde(): Date | undefined {
    return this._fechaVigenciaDesde;
  }

  getFechaVigenciaHasta(): Date | undefined {
    return this._fechaVigenciaHasta;
  }

  getPublicadoPorId(): string | undefined {
    return this.publicadoPorId;
  }

  getFechaCreacion(): Date {
    return this.fechaCreacion;
  }

  /**
   * Retorna copia defensiva para prevenir modificación externa.
   */
  getEventos(): (PoliticaCreada | PoliticaPublicada | PoliticaArchivada)[] {
    return [...this.eventos];
  }

  /**
   * Limpia eventos post-persistencia para prevenir duplicados.
   */
  vaciarEventos(): void {
    (this as any).eventos.length = 0;
  }
}
