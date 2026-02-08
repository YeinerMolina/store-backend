/**
 * DTOs inferidos directamente desde schemas Zod.
 * Esto garantiza type safety completo sin duplicación.
 */
export type {
  CrearParametroOperativoSchemaType as CrearParametroOperativoRequestDto,
  ActualizarParametroOperativoSchemaType as ActualizarParametroOperativoRequestDto,
  CrearPoliticaSchemaType as CrearPoliticaRequestDto,
  PublicarPoliticaSchemaType as PublicarPoliticaRequestDto,
} from './configuracion.schema';
