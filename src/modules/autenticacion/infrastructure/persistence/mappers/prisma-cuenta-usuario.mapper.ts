import type { CuentaUsuario as PrismaCuentaUsuario } from '@prisma/client';
import { CuentaUsuario } from '../../../domain/aggregates/cuenta-usuario/cuenta-usuario.entity';
import { TipoUsuario, EstadoCuenta } from '../../../domain/aggregates/types';

export class PrismaCuentaUsuarioMapper {
  /**
   * Garantiza type safety al excluir propiedades transitorias del aggregate
   * (sesiones, tokensRecuperacion) que no deben persistirse directamente.
   * Sirve como punto de extensión para futuras transformaciones si se necesitan.
   */
  static toPersistence(cuenta: CuentaUsuario) {
    return {
      id: cuenta.id,
      email: cuenta.email,
      passwordHash: cuenta.passwordHash,
      tipoUsuario: cuenta.tipoUsuario,
      clienteId: cuenta.clienteId,
      empleadoId: cuenta.empleadoId,
      estado: cuenta.estado,
      emailVerificado: cuenta.emailVerificado,
      intentosFallidos: cuenta.intentosFallidos,
      bloqueadoHasta: cuenta.bloqueadoHasta,
      ultimoLogin: cuenta.ultimoLogin,
      ultimoCambioPassword: cuenta.ultimoCambioPassword,
      fechaModificacion: cuenta.fechaModificacion,
    };
  }

  static toDomain(prismaData: PrismaCuentaUsuario): CuentaUsuario {
    return CuentaUsuario.desde({
      id: prismaData.id,
      email: prismaData.email,
      passwordHash: prismaData.passwordHash,
      tipoUsuario: prismaData.tipoUsuario as TipoUsuario,
      clienteId: prismaData.clienteId,
      empleadoId: prismaData.empleadoId,
      estado: prismaData.estado as EstadoCuenta,
      emailVerificado: prismaData.emailVerificado,
      intentosFallidos: prismaData.intentosFallidos,
      bloqueadoHasta: prismaData.bloqueadoHasta,
      ultimoLogin: prismaData.ultimoLogin,
      ultimoCambioPassword: prismaData.ultimoCambioPassword,
      fechaCreacion: prismaData.fechaCreacion,
      fechaModificacion: prismaData.fechaModificacion,
    });
  }
}
