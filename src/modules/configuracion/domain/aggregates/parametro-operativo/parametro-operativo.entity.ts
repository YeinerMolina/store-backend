/**
 * ParametroOperativo Aggregate Root
 *
 * Validates values by type (ENTERO, DECIMAL, BOOLEAN, DURACION, TEXTO).
 * Enforces range constraints [min, max] for numeric types.
 * Immutable after creation; changes are tracked via events.
 */

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
   * Private constructor. Use crear() or desde() factory methods.
   */
  private constructor(
    private readonly id: string,
    private readonly clave: string,
    private readonly nombre: string,
    private readonly descripcion: string | undefined,
    private readonly tipoDato: TipoDato,
    private valor: string,
    private readonly valorDefecto: string,
    private readonly valorMinimo: string | undefined,
    private readonly valorMaximo: string | undefined,
    private readonly requiereReinicio: boolean,
    private modificadoPorId: string | undefined,
    private fechaModificacion: Date,
  ) {
    Object.freeze(this);
  }

  /**
   * Factory: Create new ParametroOperativo
   *
   * Validates value type and range constraints.
   * Emits ParametroOperativoCreado event for auditability.
   */
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
   * Factory: Reconstruct from persisted data without emitting events.
   *
   * Used by repository when loading from database.
   * Events are NOT emitted here; only created() emits.
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
   * Update parameter value.
   *
   * Validates value type and range constraints.
   * Emits ParametroOperativoActualizado with requiereReinicio flag.
   * This flag notifies consumers if app restart is needed.
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

    const valorAnterior = this.valor;
    (this as any).valor = params.valor;
    (this as any).modificadoPorId = params.modificadoPorId;
    (this as any).fechaModificacion = new Date();

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

  /**
   * Private: Validate value matches type constraints.
   * Throws if validation fails (e.g., "abc" for ENTERO type).
   */
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
        // Formato esperado: "20 minutes", "5 hours", "1 day", etc.
        if (!/^\d+\s+(minute|hour|day|second)s?$/.test(valor)) {
          throw new Error(
            `Valor debe tener formato "N unit" para tipo DURACION, recibido: ${valor}`,
          );
        }
        break;

      case TipoDatoEnum.TEXTO:
        // TEXTO acepta cualquier string no vacío
        break;

      default:
        throw new Error(`Tipo desconocido: ${tipo}`);
    }
  }

  /**
   * Private: Validate value within [min, max] range.
   * Only applies to ENTERO and DECIMAL types.
   * Throws if value is out of bounds.
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
    return this.valor;
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
    return this.modificadoPorId;
  }

  getFechaModificacion(): Date {
    return this.fechaModificacion;
  }

  /**
   * Returns defensive copy of emitted events.
   * Caller cannot modify internal state via this reference.
   */
  getEventos(): (ParametroOperativoCreado | ParametroOperativoActualizado)[] {
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
