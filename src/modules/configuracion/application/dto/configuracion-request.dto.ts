export class CrearParametroOperativoRequestDto {
  clave!: string;
  nombre!: string;
  descripcion?: string;
  tipoDato!: string;
  valor!: string;
  valorDefecto!: string;

  /**
   * Solo aplican para tipos ENTERO y DECIMAL.
   */
  valorMinimo?: string;
  valorMaximo?: string;

  /**
   * Si true, cambios requieren reiniciar la aplicación.
   */
  requiereReinicio?: boolean;
}

export class ActualizarParametroOperativoRequestDto {
  valor!: string;
}

/**
 * Crea política en estado BORRADOR.
 * Debe publicarse con endpoint separado.
 */
export class CrearPoliticaRequestDto {
  tipo!: string;
  version!: string;
  contenido!: string;
}

/**
 * Transiciona política de BORRADOR a VIGENTE.
 */
export class PublicarPoliticaRequestDto {
  fechaVigenciaDesde?: Date;
}
