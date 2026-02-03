import { IdGenerator } from '@shared/domain/factories';
import {
  ActualizarParametroOperativoProps,
  CrearParametroOperativoProps,
  ParametroOperativoData,
  TipoDato,
  TipoDatoEnum,
} from '../configuracion.types';
import {
  ParametroOperativoActualizado,
  ParametroOperativoCreado,
} from '../../events/configuracion.events';

export class ParametroOperativo {
  private readonly eventos: (
    | ParametroOperativoCreado
    | ParametroOperativoActualizado
  )[] = [];

  /**
   * Campos con prefijo _ son mutables internamente pero readonly externamente.
   */
  private constructor(
    private readonly id: string,
    private readonly clave: string,
    private readonly nombre: string,
    private readonly descripcion: string | undefined,
    private readonly tipoDato: TipoDato,
    private _valor: string,
    private readonly valorDefecto: string,
    private readonly valorMinimo: string | undefined,
    private readonly valorMaximo: string | undefined,
    private readonly requiereReinicio: boolean,
    private _modificadoPorId: string | undefined,
    private _fechaModificacion: Date,
  ) {
    Object.freeze(this);
  }

  static crear(params: CrearParametroOperativoProps): ParametroOperativo {
    const id = IdGenerator.generate();

    ParametroOperativo.validarValor(params.valor, params.tipoDato);

    if (params.valorMinimo || params.valorMaximo) {
      ParametroOperativo.validarRango(
        params.valor,
        params.valorMinimo,
        params.valorMaximo,
        params.tipoDato,
      );
    }

    const parametro = new ParametroOperativo(
      id,
      params.clave,
      params.nombre,
      params.descripcion,
      params.tipoDato,
      params.valor,
      params.valorDefecto,
      params.valorMinimo,
      params.valorMaximo,
      params.requiereReinicio ?? false,
      undefined,
      new Date(),
    );

    parametro.eventos.push(
      new ParametroOperativoCreado(id, params.clave, params.valor),
    );

    return parametro;
  }

  /**
   * Reconstituye desde BD sin emitir eventos.
   */
  static desde(data: ParametroOperativoData): ParametroOperativo {
    return new ParametroOperativo(
      data.id,
      data.clave,
      data.nombre,
      data.descripcion,
      data.tipoDato,
      data.valor,
      data.valorDefecto,
      data.valorMinimo,
      data.valorMaximo,
      data.requiereReinicio,
      data.modificadoPorId,
      data.fechaModificacion,
    );
  }

  /**
   * Evento emitido incluye flag requiereReinicio para notificar si se necesita reiniciar la app.
   */
  actualizar(params: ActualizarParametroOperativoProps): void {
    ParametroOperativo.validarValor(params.valor, this.tipoDato);

    if (this.valorMinimo || this.valorMaximo) {
      ParametroOperativo.validarRango(
        params.valor,
        this.valorMinimo,
        this.valorMaximo,
        this.tipoDato,
      );
    }

    const valorAnterior = this._valor;
    this._valor = params.valor;
    this._modificadoPorId = params.modificadoPorId;
    this._fechaModificacion = new Date();

    this.eventos.push(
      new ParametroOperativoActualizado(
        this.id,
        this.clave,
        valorAnterior,
        params.valor,
        this.requiereReinicio,
      ),
    );
  }

  private static validarValor(valor: string, tipo: TipoDato): void {
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
        if (!['true', 'false', '0', '1'].includes(valor.toLowerCase())) {
          throw new Error(
            `Valor debe ser true/false/0/1 para tipo BOOLEAN, recibido: ${valor}`,
          );
        }
        break;

      case TipoDatoEnum.DURACION:
        if (!/^\d+\s+(minute|hour|day|second)s?$/.test(valor)) {
          throw new Error(
            `Valor debe tener formato "N unit" para tipo DURACION, recibido: ${valor}`,
          );
        }
        break;

      case TipoDatoEnum.TEXTO:
        break;

      default:
        throw new Error(`Tipo desconocido: ${tipo}`);
    }
  }

  /**
   * Solo aplica a tipos ENTERO y DECIMAL.
   */
  private static validarRango(
    valor: string,
    minimo: string | undefined,
    maximo: string | undefined,
    tipo: TipoDato,
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

  getId(): string {
    return this.id;
  }

  getClave(): string {
    return this.clave;
  }

  getNombre(): string {
    return this.nombre;
  }

  getDescripcion(): string | undefined {
    return this.descripcion;
  }

  getTipoDato(): TipoDato {
    return this.tipoDato;
  }

  getValor(): string {
    return this._valor;
  }

  getValorDefecto(): string {
    return this.valorDefecto;
  }

  getValorMinimo(): string | undefined {
    return this.valorMinimo;
  }

  getValorMaximo(): string | undefined {
    return this.valorMaximo;
  }

  isRequiereReinicio(): boolean {
    return this.requiereReinicio;
  }

  getModificadoPorId(): string | undefined {
    return this._modificadoPorId;
  }

  getFechaModificacion(): Date {
    return this._fechaModificacion;
  }

  /**
   * Retorna copia defensiva para prevenir modificación externa.
   */
  getEventos(): (ParametroOperativoCreado | ParametroOperativoActualizado)[] {
    return [...this.eventos];
  }

  /**
   * Limpia eventos post-persistencia para prevenir duplicados.
   */
  vaciarEventos(): void {
    (this as any).eventos.length = 0;
  }
}
