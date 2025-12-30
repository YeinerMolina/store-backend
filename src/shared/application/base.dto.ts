/**
 * DTO Base (Data Transfer Object)
 * Los DTOs son lo que viaja por HTTP, no los aggregados directamente
 * Esto crea una capa de aislamiento entre la API y el dominio
 */
export abstract class BaseDTO {
  readonly id: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}
