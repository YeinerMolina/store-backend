import { TipoDatoEnum } from '../aggregates/configuracion.types';

/**
 * Parsea el valor string de un parámetro operativo a su tipo nativo.
 *
 * Uso en otros módulos:
 * ```ts
 * const parametro = await configuracionPort.obtenerParametro('DURACION_RESERVA_VENTA');
 * const segundos = parseParametroValor(parametro.valor, parametro.tipoDato) as number;
 * ```
 *
 * @throws Error si el valor no puede ser parseado según el tipo
 */
export function parseParametroValor(
  valor: string,
  tipoDato: TipoDatoEnum,
): number | boolean {
  switch (tipoDato) {
    case TipoDatoEnum.ENTERO: {
      const parsed = Number(valor);
      if (!Number.isInteger(parsed)) {
        throw new Error(`No se puede parsear "${valor}" como ENTERO`);
      }
      return parsed;
    }

    case TipoDatoEnum.DECIMAL: {
      const parsed = Number(valor);
      if (isNaN(parsed)) {
        throw new Error(`No se puede parsear "${valor}" como DECIMAL`);
      }
      return parsed;
    }

    case TipoDatoEnum.BOOLEAN: {
      const normalized = valor.toLowerCase();
      if (normalized === 'true') return true;
      if (normalized === 'false') return false;
      throw new Error(
        `No se puede parsear "${valor}" como BOOLEAN (esperado: "true" o "false")`,
      );
    }

    default:
      throw new Error(`Tipo de dato desconocido: ${tipoDato}`);
  }
}
