import { Injectable, Inject } from '@nestjs/common';
import type { CuentaUsuario as PrismaCuentaUsuario } from '@prisma/client';
import { CuentaUsuario } from '../../../domain/aggregates/cuenta-usuario/cuenta-usuario.entity';
import { SesionUsuario } from '../../../domain/aggregates/sesion-usuario/sesion-usuario.entity';
import { TokenRecuperacion } from '../../../domain/aggregates/token-recuperacion/token-recuperacion.entity';
import type { CuentaUsuarioRepository } from '../../../domain/ports/outbound/cuenta-usuario.repository';
import type { GuardarCuentaUsuarioOptions } from '../../../domain/aggregates/cuenta-usuario/cuenta-usuario.types';
import { PrismaCuentaUsuarioMapper } from '../mappers/prisma-cuenta-usuario.mapper';
import { PrismaSesionUsuarioMapper } from '../mappers/prisma-sesion-usuario.mapper';
import { PrismaTokenRecuperacionMapper } from '../mappers/prisma-token-recuperacion.mapper';
import {
  PrismaService,
  type PrismaTransactionClient,
  type TransactionManager,
} from '@shared/database';
import { TRANSACTION_MANAGER_TOKEN } from '../../../domain/ports/tokens';

/**
 * Uses declarative options for atomic persistence of the entire aggregate.
 */
@Injectable()
export class CuentaUsuarioPostgresRepository implements CuentaUsuarioRepository {
  constructor(
    private readonly prismaService: PrismaService,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly transactionManager: TransactionManager,
  ) {}

  async guardar(
    cuenta: CuentaUsuario,
    opciones?: GuardarCuentaUsuarioOptions,
  ): Promise<void> {
    await this.transactionManager.transaction(async (tx) => {
      await this.persistirCuenta(tx, cuenta);

      if (opciones?.sesiones?.nuevas) {
        await this.guardarSesionesNuevas(tx, opciones.sesiones.nuevas);
      }

      if (opciones?.sesiones?.actualizadas) {
        await this.actualizarSesiones(tx, opciones.sesiones.actualizadas);
      }

      if (opciones?.sesiones?.eliminadas) {
        await this.eliminarSesiones(tx, opciones.sesiones.eliminadas);
      }

      if (opciones?.tokensRecuperacion?.nuevos) {
        await this.guardarTokensNuevos(tx, opciones.tokensRecuperacion.nuevos);
      }

      if (opciones?.tokensRecuperacion?.actualizados) {
        await this.actualizarTokens(
          tx,
          opciones.tokensRecuperacion.actualizados,
        );
      }
    });
  }

  private async persistirCuenta(
    tx: PrismaTransactionClient,
    cuenta: CuentaUsuario,
  ): Promise<void> {
    const data = PrismaCuentaUsuarioMapper.toPersistence(cuenta);

    await tx.cuentaUsuario.upsert({
      where: { id: cuenta.id },
      create: {
        ...data,
        fechaCreacion: cuenta.fechaCreacion,
      },
      update: data,
    });
  }

  private async guardarSesionesNuevas(
    tx: PrismaTransactionClient,
    sesiones: SesionUsuario[],
  ): Promise<void> {
    if (sesiones.length === 0) {
      return;
    }

    for (const sesion of sesiones) {
      const data = PrismaSesionUsuarioMapper.toPersistence(sesion);
      await tx.sesionUsuario.create({ data });
    }
  }

  private async actualizarSesiones(
    tx: PrismaTransactionClient,
    sesiones: SesionUsuario[],
  ): Promise<void> {
    if (sesiones.length === 0) {
      return;
    }

    for (const sesion of sesiones) {
      const data = PrismaSesionUsuarioMapper.toPersistence(sesion);

      await tx.sesionUsuario.update({
        where: { id: sesion.id },
        data: {
          estado: data.estado,
          fechaUltimoUso: data.fechaUltimoUso,
          fechaRevocacion: data.fechaRevocacion,
          revocadaPor: data.revocadaPor,
          motivoRevocacion: data.motivoRevocacion,
        },
      });
    }
  }

  /**
   * Hard deletes sessions (used for revocation or expiration cleanup).
   * Sessions are transient security artifacts, not business entities.
   */
  private async eliminarSesiones(
    tx: PrismaTransactionClient,
    sesionIds: string[],
  ): Promise<void> {
    if (sesionIds.length === 0) {
      return;
    }

    await tx.sesionUsuario.deleteMany({
      where: {
        id: {
          in: sesionIds,
        },
      },
    });
  }

  private async guardarTokensNuevos(
    tx: PrismaTransactionClient,
    tokens: TokenRecuperacion[],
  ): Promise<void> {
    if (tokens.length === 0) {
      return;
    }

    for (const token of tokens) {
      const data = PrismaTokenRecuperacionMapper.toPersistence(token);
      await tx.tokenRecuperacion.create({ data });
    }
  }

  private async actualizarTokens(
    tx: PrismaTransactionClient,
    tokens: TokenRecuperacion[],
  ): Promise<void> {
    if (tokens.length === 0) {
      return;
    }

    for (const token of tokens) {
      const data = PrismaTokenRecuperacionMapper.toPersistence(token);

      await tx.tokenRecuperacion.update({
        where: { id: token.id },
        data: {
          estado: data.estado,
          fechaUso: data.fechaUso,
        },
      });
    }
  }

  async buscarPorId(id: string): Promise<CuentaUsuario | null> {
    const data = await this.prismaService.cuentaUsuario.findUnique({
      where: { id },
    });

    return data ? this.reconstituirCuenta(data) : null;
  }

  async buscarPorEmail(email: string): Promise<CuentaUsuario | null> {
    const data = await this.prismaService.cuentaUsuario.findUnique({
      where: { email },
    });

    return data ? this.reconstituirCuenta(data) : null;
  }

  async buscarPorClienteId(clienteId: string): Promise<CuentaUsuario | null> {
    const data = await this.prismaService.cuentaUsuario.findUnique({
      where: { clienteId },
    });

    return data ? this.reconstituirCuenta(data) : null;
  }

  async buscarPorEmpleadoId(empleadoId: string): Promise<CuentaUsuario | null> {
    const data = await this.prismaService.cuentaUsuario.findUnique({
      where: { empleadoId },
    });

    return data ? this.reconstituirCuenta(data) : null;
  }

  async buscarPorRefreshToken(
    refreshTokenHash: string,
  ): Promise<CuentaUsuario | null> {
    const sesion = await this.prismaService.sesionUsuario.findUnique({
      where: { refreshTokenHash },
      include: { cuentaUsuario: true },
    });

    return sesion?.cuentaUsuario
      ? this.reconstituirCuenta(sesion.cuentaUsuario)
      : null;
  }

  async buscarPorTokenHash(tokenHash: string): Promise<CuentaUsuario | null> {
    const token = await this.prismaService.tokenRecuperacion.findUnique({
      where: { tokenHash },
      include: { cuentaUsuario: true },
    });

    return token?.cuentaUsuario
      ? this.reconstituirCuenta(token.cuentaUsuario)
      : null;
  }

  async existePorEmail(email: string): Promise<boolean> {
    const cuenta = await this.prismaService.cuentaUsuario.findUnique({
      where: { email },
      select: { id: true },
    });

    return cuenta !== null;
  }

  private reconstituirCuenta(data: PrismaCuentaUsuario): CuentaUsuario {
    return PrismaCuentaUsuarioMapper.toDomain(data);
  }
}
