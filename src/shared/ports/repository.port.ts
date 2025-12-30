import { AggregateRoot } from '../domain/entity';

/**
 * Repository Port
 * Contrato que deben cumplir TODOS los repositorios
 * Esto desacopla la lógica de negocio de la implementación (TypeORM, Prisma, etc)
 *
 * IMPORTANTE: La interfaz está genérica, cada agregado tiene su propio repositorio
 * que implementa esta interfaz
 */
export interface IRepository<T extends AggregateRoot<any>> {
  /**
   * Guarda una nueva entidad o actualiza una existente
   */
  save(entity: T): Promise<void>;

  /**
   * Busca por ID
   */
  findById(id: string): Promise<T | null>;

  /**
   * Obtiene todas las entidades
   */
  findAll(): Promise<T[]>;

  /**
   * Elimina una entidad
   */
  delete(id: string): Promise<void>;

  /**
   * Cuenta entidades (útil para paginación)
   */
  count(): Promise<number>;
}

/**
 * Unit of Work Port
 * Maneja transacciones. Cuando guardas múltiples agregados,
 * necesitas garantizar que todos se guardan o ninguno.
 */
export interface IUnitOfWork {
  /**
   * Comienza una transacción
   */
  begin(): Promise<void>;

  /**
   * Confirma la transacción
   */
  commit(): Promise<void>;

  /**
   * Revierte la transacción
   */
  rollback(): Promise<void>;

  /**
   * Ejecuta código dentro de una transacción
   */
  execute<T>(callback: () => Promise<T>): Promise<T>;
}
