import {
  ActualizarParametroOperativoProps,
  CrearParametroOperativoProps,
  ParametroOperativoEvento,
  TipoDatoEnum,
} from '../configuracion.types';
import {
  ParametroOperativoActualizado,
  ParametroOperativoCreado,
} from '../../events';
import type { ParametroOperativoData } from './parametro-operativo.types';

export class ParametroOperativo {
  readonly #id: string;
  readonly #clave: string;
  readonly #nombre: string;
  readonly #descripcion: string | undefined;
  readonly #tipoDato: TipoDatoEnum;
  #valor: string;
  readonly #valorDefecto: string;
  readonly #valorMinimo: string | undefined;
  readonly #valorMaximo: string | undefined;
  readonly #requiereReinicio: boolean;
  #modificadoPorId: string | undefined;
  #fechaModificacion: Date;
  readonly #eventos: ParametroOperativoEvento[] = [];

  get id(): string {
    return this.#id;
  }

  get clave(): string {
    return this.#clave;
  }

  get nombre(): string {
    return this.#nombre;
  }

  get descripcion(): string | undefined {
    return this.#descripcion;
  }

  get tipoDato(): TipoDatoEnum {
    return this.#tipoDato;
  }

  get valor(): string {
    return this.#valor;
  }

  get valorDefecto(): string {
    return this.#valorDefecto;
  }

  get valorMinimo(): string | undefined {
    return this.#valorMinimo;
  }

  get valorMaximo(): string | undefined {
    return this.#valorMaximo;
  }

  get requiereReinicio(): boolean {
    return this.#requiereReinicio;
  }

  get modificadoPorId(): string | undefined {
    return this.#modificadoPorId;
  }

  get fechaModificacion(): Date {
    return this.#fechaModificacion;
  }

  get eventos(): ParametroOperativoEvento[] {
    return [...this.#eventos];
  }

  private constructor(props: ParametroOperativoData) {
    this.#id = props.id;
    this.#clave = props.clave;
    this.#nombre = props.nombre;
    this.#descripcion = props.descripcion;
    this.#tipoDato = props.tipoDato;
    this.#valor = props.valor;
    this.#valorDefecto = props.valorDefecto;
    this.#valorMinimo = props.valorMinimo;
    this.#valorMaximo = props.valorMaximo;
    this.#requiereReinicio = props.requiereReinicio;
    this.#modificadoPorId = props.modificadoPorId;
    this.#fechaModificacion = props.fechaModificacion;
  }

  static crear(
    id: string,
    params: CrearParametroOperativoProps,
  ): ParametroOperativo {
    ParametroOperativo.validarValor(params.valor, params.tipoDato);

    if (params.valorMinimo || params.valorMaximo) {
      ParametroOperativo.validarRango(
        params.valor,
        params.valorMinimo,
        params.valorMaximo,
        params.tipoDato,
      );
    }

    const parametro = new ParametroOperativo({
      id,
      clave: params.clave,
      nombre: params.nombre,
      descripcion: params.descripcion,
      tipoDato: params.tipoDato,
      valor: params.valor,
      valorDefecto: params.valorDefecto,
      valorMinimo: params.valorMinimo,
      valorMaximo: params.valorMaximo,
      requiereReinicio: params.requiereReinicio ?? false,
      modificadoPorId: undefined,
      fechaModificacion: new Date(),
    });

    parametro.#eventos.push(
      new ParametroOperativoCreado(id, params.clave, params.valor),
    );

    return parametro;
  }

  static desde(data: ParametroOperativoData): ParametroOperativo {
    return new ParametroOperativo(data);
  }

  actualizar(params: ActualizarParametroOperativoProps): void {
    ParametroOperativo.validarValor(params.valor, this.#tipoDato);

    if (this.#valorMinimo || this.#valorMaximo) {
      ParametroOperativo.validarRango(
        params.valor,
        this.#valorMinimo,
        this.#valorMaximo,
        this.#tipoDato,
      );
    }

    const valorAnterior = this.#valor;
    this.#valor = params.valor;
    this.#modificadoPorId = params.modificadoPorId;
    this.#fechaModificacion = new Date();

    this.#eventos.push(
      new ParametroOperativoActualizado(
        this.#id,
        this.#clave,
        valorAnterior,
        params.valor,
        this.#requiereReinicio,
      ),
    );
  }

  private static validarValor(valor: string, tipo: TipoDatoEnum): void {
    if (!valor || valor.trim() === '') {
      throw new Error(`Valor no puede estar vacío para tipo ${tipo}`);
    }

    switch (tipo) {
      case TipoDatoEnum.ENTERO:
        if (!Number.isInteger(Number(valor))) {
          throw new Error(
            `Valor debe ser entero para tipo ENTERO, recibido: ${valor}`,
          );
        }
        break;

      case TipoDatoEnum.DECIMAL:
        if (isNaN(Number(valor))) {
          throw new Error(
            `Valor debe ser decimal válido para tipo DECIMAL, recibido: ${valor}`,
          );
        }
        break;

      case TipoDatoEnum.BOOLEAN:
        if (!['true', 'false'].includes(valor.toLowerCase())) {
          throw new Error(
            `Valor debe ser "true" o "false" para tipo BOOLEAN, recibido: ${valor}`,
          );
        }
        break;

      default:
        throw new Error(`Tipo desconocido: ${tipo}`);
    }
  }

  private static validarRango(
    valor: string,
    minimo: string | undefined,
    maximo: string | undefined,
    tipo: TipoDatoEnum,
  ): void {
    if (tipo !== TipoDatoEnum.ENTERO && tipo !== TipoDatoEnum.DECIMAL) {
      return;
    }

    const numericValue = Number(valor);

    if (minimo !== undefined) {
      const min = Number(minimo);
      if (numericValue < min) {
        throw new Error(
          `Valor ${valor} es menor que mínimo permitido: ${minimo}`,
        );
      }
    }

    if (maximo !== undefined) {
      const max = Number(maximo);
      if (numericValue > max) {
        throw new Error(
          `Valor ${valor} es mayor que máximo permitido: ${maximo}`,
        );
      }
    }
  }

  vaciarEventos(): void {
    this.#eventos.length = 0;
  }
}
