import {
  CrearPoliticaProps,
  EstadoPoliticaEnum,
  PoliticaEvento,
  PublicarPoliticaProps,
  TipoPoliticaEnum,
} from '../configuracion.types';
import {
  PoliticaArchivada,
  PoliticaCreada,
  PoliticaPublicada,
} from '../../events';
import type { PoliticaData } from './politica.types';

export class Politica {
  readonly #id: string;
  readonly #tipo: TipoPoliticaEnum;
  readonly #version: string;
  readonly #contenido: string;
  #estado: EstadoPoliticaEnum;
  #fechaVigenciaDesde: Date | undefined;
  #fechaVigenciaHasta: Date | undefined;
  readonly #publicadoPorId: string | undefined;
  readonly #fechaCreacion: Date;
  #eventos: PoliticaEvento[] = [];

  get id(): string {
    return this.#id;
  }

  get tipo(): TipoPoliticaEnum {
    return this.#tipo;
  }

  get version(): string {
    return this.#version;
  }

  get contenido(): string {
    return this.#contenido;
  }

  get estado(): EstadoPoliticaEnum {
    return this.#estado;
  }

  get fechaCreacion(): Date {
    return this.#fechaCreacion;
  }

  get eventos(): PoliticaEvento[] {
    return [...this.#eventos];
  }

  get fechaVigenciaDesde(): Date | undefined {
    return this.#fechaVigenciaDesde;
  }

  get fechaVigenciaHasta(): Date | undefined {
    return this.#fechaVigenciaHasta;
  }

  get publicadoPorId(): string | undefined {
    return this.#publicadoPorId;
  }

  private constructor(props: PoliticaData) {
    this.#id = props.id;
    this.#tipo = props.tipo;
    this.#version = props.version;
    this.#contenido = props.contenido;
    this.#estado = props.estado;
    this.#fechaVigenciaDesde = props.fechaVigenciaDesde;
    this.#fechaVigenciaHasta = props.fechaVigenciaHasta;
    this.#publicadoPorId = props.publicadoPorId;
    this.#fechaCreacion = props.fechaCreacion;
  }

  static crear(id: string, params: CrearPoliticaProps): Politica {
    if (!params.contenido || params.contenido.trim().length === 0) {
      throw new Error('Contenido de política no puede estar vacío');
    }

    const politica = new Politica({
      id,
      tipo: params.tipo,
      version: params.version,
      contenido: params.contenido,
      estado: EstadoPoliticaEnum.BORRADOR,
      fechaVigenciaDesde: undefined,
      fechaVigenciaHasta: undefined,
      publicadoPorId: params.publicadoPorId,
      fechaCreacion: new Date(),
    });

    politica.#eventos.push(new PoliticaCreada(id, params.tipo, params.version));

    return politica;
  }

  static desde(data: PoliticaData): Politica {
    return new Politica(data);
  }

  publicar(params: PublicarPoliticaProps): void {
    if (this.#estado !== EstadoPoliticaEnum.BORRADOR) {
      throw new Error(
        `No se puede publicar política en estado ${this.#estado}. Solo BORRADOR puede publicarse.`,
      );
    }

    const ahora = new Date();
    this.#estado = EstadoPoliticaEnum.VIGENTE;
    this.#fechaVigenciaDesde = params.fechaVigenciaDesde || ahora;

    this.#eventos.push(
      new PoliticaPublicada(
        this.#id,
        this.#tipo,
        this.#version,
        this.#fechaVigenciaDesde,
      ),
    );
  }

  archivar(fechaVigenciaHasta?: Date): void {
    if (this.#estado === EstadoPoliticaEnum.ARCHIVADA) {
      throw new Error(
        'Política ya está ARCHIVADA, no se puede archivar nuevamente.',
      );
    }

    this.#estado = EstadoPoliticaEnum.ARCHIVADA;
    this.#fechaVigenciaHasta = fechaVigenciaHasta || new Date();

    this.#eventos.push(
      new PoliticaArchivada(this.#id, this.#tipo, this.#version),
    );
  }

  estaVigenteEn(fecha: Date = new Date()): boolean {
    if (this.#estado !== EstadoPoliticaEnum.VIGENTE) {
      return false;
    }

    if (this.#fechaVigenciaDesde && fecha < this.#fechaVigenciaDesde) {
      return false;
    }

    if (this.#fechaVigenciaHasta && fecha >= this.#fechaVigenciaHasta) {
      return false;
    }

    return true;
  }

  vaciarEventos(): void {
    this.#eventos = [];
  }
}
