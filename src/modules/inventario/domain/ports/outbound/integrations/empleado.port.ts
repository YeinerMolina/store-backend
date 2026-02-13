// TODO: Implementar cuando IDENTIDAD esté disponible
export interface EmpleadoPort {
  validarPermiso(empleadoId: string, permiso: string): Promise<boolean>;
}
