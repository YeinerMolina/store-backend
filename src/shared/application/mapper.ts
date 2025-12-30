import { Entity, AggregateRoot } from '../domain/entity';
import { BaseDTO } from './base.dto';

/**
 * Mapper base para convertir entre Domain Models y DTOs
 *
 * NUNCA expongas directamente los agregados en HTTP responses.
 * Siempre mapea a DTOs.
 *
 * Ej:
 * const product = await repository.findById(id);  // AggregateRoot
 * const dto = ProductMapper.toDTO(product);       // BaseDTO
 * return dto;                                       // Respuesta HTTP
 */
export abstract class Mapper<T extends AggregateRoot<any>, D extends BaseDTO> {
  abstract toDomain(raw: any): T;
  abstract toDTO(domain: T): D;
  abstract toPersistence(domain: T): any;
}
