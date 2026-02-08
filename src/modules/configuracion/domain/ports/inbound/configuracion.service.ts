import {
  CrearParametroOperativoProps,
  ActualizarParametroOperativoProps,
  CrearPoliticaProps,
  PublicarPoliticaProps,
  TipoPoliticaEnum,
} from '../../aggregates/configuracion.types';
import { ParametroOperativo } from '../../aggregates/parametro-operativo/parametro-operativo.entity';
import { Politica } from '../../aggregates/politica/politica.entity';

export interface ConfiguracionService {
  crearParametroOperativo(
    params: CrearParametroOperativoProps,
  ): Promise<ParametroOperativo>;

  actualizarParametroOperativo(
    id: string,
    params: ActualizarParametroOperativoProps,
  ): Promise<ParametroOperativo>;

  obtenerParametroOperativo(id: string): Promise<ParametroOperativo | null>;

  obtenerParametroPorClave(clave: string): Promise<ParametroOperativo | null>;

  listarParametros(): Promise<ParametroOperativo[]>;

  crearPolitica(params: CrearPoliticaProps): Promise<Politica>;

  publicarPolitica(
    politicaId: string,
    params: PublicarPoliticaProps,
  ): Promise<Politica>;

  obtenerPoliticaVigente(tipo: TipoPoliticaEnum): Promise<Politica | null>;
  listarPoliticas(tipo?: TipoPoliticaEnum): Promise<Politica[]>;
}
