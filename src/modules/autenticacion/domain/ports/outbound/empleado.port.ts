/**
 * Puerto para interacción con módulo IDENTIDAD (gestión de Empleados).
 */
export interface EmpleadoPort {
  buscarPorId(empleadoId: string): Promise<{
    id: string;
    nombre: string;
    apellido: string;
    email: string | null;
  } | null>;

  existePorId(empleadoId: string): Promise<boolean>;
}
