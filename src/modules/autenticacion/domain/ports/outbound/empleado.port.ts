import type { EmpleadoBasicInfo } from './empleado.types';

export interface EmpleadoPort {
  buscarPorId(empleadoId: string): Promise<EmpleadoBasicInfo | null>;

  existePorId(empleadoId: string): Promise<boolean>;
}
