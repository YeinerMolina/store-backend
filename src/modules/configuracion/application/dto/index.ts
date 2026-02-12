// Request Schemas y DTOs
export {
  CrearParametroOperativoSchema,
  type CrearParametroOperativoSchemaType as CrearParametroOperativoRequestDto,
  ActualizarParametroOperativoSchema,
  type ActualizarParametroOperativoSchemaType as ActualizarParametroOperativoRequestDto,
  CrearPoliticaSchema,
  type CrearPoliticaSchemaType as CrearPoliticaRequestDto,
  PublicarPoliticaSchema,
  type PublicarPoliticaSchemaType as PublicarPoliticaRequestDto,
} from './configuracion.schema';

// Response DTOs
export {
  ParametroOperativoResponseDto,
  PoliticaResponseDto,
} from './configuracion-response.dto';
