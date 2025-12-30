# Cómo Agregar Nuevos Módulos

Este es el checklist que debes seguir para agregar cada nuevo módulo. Usa **Inventory** como referencia (está en `src/modules/inventory/`).

---

## 0. Antes de Empezar

Lee estas líneas:
- `ARCHITECTURE.md` → Entiende los principios
- `src/modules/inventory/domain/inventory-item.entity.ts` → Cómo estructurar un agregado
- `src/modules/inventory/application/services/adjust-inventory.service.ts` → Cómo orquestar
- `src/modules/inventory/infrastructure/persistence/inventory-item.repository.ts` → Cómo implementar

**Regla de Oro**: El patrón de Inventory es el que vas a repetir en TODOS lados.

---

## 1. Crear Estructura de Carpetas

```bash
mkdir -p src/modules/<MODULE_NAME>/{domain,application,infrastructure,presentation}
mkdir -p src/modules/<MODULE_NAME>/application/{services,mappers,__tests__}
mkdir -p src/modules/<MODULE_NAME>/infrastructure/persistence
mkdir -p src/modules/<MODULE_NAME>/presentation/{dtos,__tests__}
```

Ejemplo para Orders:
```bash
mkdir -p src/modules/orders/{domain,application,infrastructure,presentation}
mkdir -p src/modules/orders/application/{services,mappers,__tests__}
mkdir -p src/modules/orders/infrastructure/persistence
mkdir -p src/modules/orders/presentation/{dtos,__tests__}
```

---

## 2. Domain Layer (Pura Lógica de Negocio)

### 2.1 Crear el AggregateRoot

`src/modules/<MODULE>/domain/<entity>.entity.ts`

**Template**:
```typescript
import { AggregateRoot, DomainEvent } from '../../../shared/domain/entity';
import { ValueObject } from '../../../shared/domain/value-object';

// 1. Value Objects (inmutables)
export class CustomValue extends ValueObject<{ value: any }> {
  constructor(value: any) {
    // Validaciones
    if (!value) throw new Error('Invalid');
    super({ value });
  }

  get value() {
    return this.props.value;
  }
}

// 2. Domain Events
export class YourEntityCreatedEvent extends DomainEvent {
  constructor(aggregateId: string, public readonly data: any) {
    super(aggregateId);
  }
  getEventName(): string {
    return 'your.entity.created';
  }
}

// 3. Entity Props
export interface YourEntityProps {
  field1: CustomValue;
  field2: string;
  createdAt: Date;
  updatedAt: Date;
}

// 4. AggregateRoot
export class YourEntity extends AggregateRoot<YourEntityProps> {
  private constructor(props: YourEntityProps, id?: string) {
    super(props, id);
  }

  static create(field1: CustomValue, field2: string): YourEntity {
    const entity = new YourEntity({
      field1,
      field2,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    entity.addDomainEvent(new YourEntityCreatedEvent(entity.id, field2));
    return entity;
  }

  static restore(props: YourEntityProps, id: string): YourEntity {
    return new YourEntity(props, id);
  }

  // Getters
  get field1(): CustomValue {
    return this.props.field1;
  }

  // Business methods
  someBusinessLogic(): void {
    // Validar, modificar estado, emitir eventos
    this.addDomainEvent(new SomeEvent(this.id, 'data'));
  }
}
```

**Reglas**:
- ✅ Validaciones rigurosas en Value Objects
- ✅ Métodos que representen acciones de negocio
- ✅ Emitir eventos cuando algo importante ocurra
- ❌ NO: Inyecciones, llamadas a BD, frameworks
- ❌ NO: `async/await` (pura lógica síncrona)

### 2.2 Crear el Repository Port

`src/modules/<MODULE>/domain/<entity>.repository.ts`

**Template**:
```typescript
import type { IRepository } from '../../../shared/ports/repository.port';
import { YourEntity } from './<entity>.entity';

export interface IYourRepository extends IRepository<YourEntity> {
  // Métodos específicos del negocio
  findByCustomCriteria(criteria: string): Promise<YourEntity | null>;
  findAllBySomething(filter: string): Promise<YourEntity[]>;
}

export const YOUR_REPOSITORY_TOKEN = 'IYourRepository';
```

**Notas**:
- Extiende `IRepository<YourEntity>` (que tiene `save`, `findById`, `findAll`, `delete`, `count`)
- Agrega métodos específicos del negocio
- Es una INTERFAZ (Port). La implementación va en Infrastructure.

---

## 3. Application Layer (Orquestación)

### 3.1 Crear Services (Use Cases)

`src/modules/<MODULE>/application/services/<action>.service.ts`

**Template**:
```typescript
import { Injectable, Inject } from '@nestjs/common';
import type { IYourRepository } from '../../domain/<entity>.repository';
import { YOUR_REPOSITORY_TOKEN } from '../../domain/<entity>.repository';
import type { IEventPublisher } from '../../../../shared/ports/event-publisher.port';

@Injectable()
export class YourActionService {
  constructor(
    @Inject(YOUR_REPOSITORY_TOKEN)
    private repository: IYourRepository,

    @Inject('EventPublisher')
    private eventPublisher: IEventPublisher,
  ) {}

  async execute(dto: any): Promise<void> {
    // 1. Obtener o crear agregado
    const entity = YourEntity.create(/* params */);

    // 2. Modificar si es necesario
    entity.someBusinessLogic();

    // 3. Guardar
    await this.repository.save(entity);

    // 4. Publicar eventos
    await this.eventPublisher.publishMany(entity.getDomainEvents());

    // 5. Limpiar
    entity.clearDomainEvents();
  }
}
```

**Un service = Un use case**
- `CreateYourEntityService`
- `UpdateYourEntityService`
- `DeleteYourEntityService`
- etc.

### 3.2 Crear Mappers

`src/modules/<MODULE>/application/mappers/<entity>.mapper.ts`

**Template**:
```typescript
import { Mapper } from '../../../../shared/application/mapper';
import { YourEntity } from '../../domain/<entity>.entity';
import { YourEntityDTO } from '../../presentation/dtos/<entity>.dto';

export class YourEntityMapper extends Mapper<YourEntity, YourEntityDTO> {
  toDomain(raw: any): YourEntity {
    return YourEntity.restore(
      {
        field1: new CustomValue(raw.field1),
        field2: raw.field2,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      raw.id,
    );
  }

  toDTO(domain: YourEntity): YourEntityDTO {
    const props = domain.unpack();
    const dto = new YourEntityDTO();
    dto.id = domain.id;
    dto.field1 = props.field1.value;
    dto.field2 = props.field2;
    return dto;
  }

  toPersistence(domain: YourEntity): any {
    const props = domain.unpack();
    return {
      id: domain.id,
      field1: props.field1.value,
      field2: props.field2,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }
}
```

---

## 4. Infrastructure Layer (Detalles Técnicos)

### 4.1 Crear TypeORM Schema

`src/modules/<MODULE>/infrastructure/persistence/<entity>.schema.ts`

**Template**:
```typescript
import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('your_entities')
@Index(['someUniqueField'], { unique: true })
export class YourEntitySchema {
  @PrimaryColumn('uuid')
  id: string;

  @Column('varchar', { length: 255 })
  field1: string;

  @Column('text')
  field2: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 4.2 Crear Repository Implementation

`src/modules/<MODULE>/infrastructure/persistence/<entity>.repository.ts`

**Template**:
```typescript
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { YourEntitySchema } from './<entity>.schema';
import { IYourRepository } from '../../domain/<entity>.repository';
import { YourEntity } from '../../domain/<entity>.entity';

@Injectable()
export class TypeOrmYourRepository implements IYourRepository {
  private repository: Repository<YourEntitySchema>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(YourEntitySchema);
  }

  async save(entity: YourEntity): Promise<void> {
    const props = entity.unpack();
    const schema = { /* mapear props a schema */ };
    await this.repository.upsert(schema, ['id']);
  }

  async findById(id: string): Promise<YourEntity | null> {
    const schema = await this.repository.findOne({ where: { id } });
    return schema ? this.toDomain(schema) : null;
  }

  async findByCustomCriteria(criteria: string): Promise<YourEntity | null> {
    const schema = await this.repository.findOne({ where: { /* filter */ } });
    return schema ? this.toDomain(schema) : null;
  }

  async findAll(): Promise<YourEntity[]> {
    const schemas = await this.repository.find();
    return schemas.map((s) => this.toDomain(s));
  }

  async findAllBySomething(filter: string): Promise<YourEntity[]> {
    const schemas = await this.repository.find({ where: { /* filter */ } });
    return schemas.map((s) => this.toDomain(s));
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async count(): Promise<number> {
    return this.repository.count();
  }

  private toDomain(schema: YourEntitySchema): YourEntity {
    return YourEntity.restore(
      { /* convertir schema props a entity props */ },
      schema.id,
    );
  }
}
```

---

## 5. Presentation Layer (HTTP)

### 5.1 Crear DTOs

`src/modules/<MODULE>/presentation/dtos/<entity>.dto.ts`

**Template**:
```typescript
import { BaseDTO } from '../../../../shared/application/base.dto';
import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class YourEntityDTO extends BaseDTO {
  declare id: string;
  
  @IsString()
  @IsNotEmpty()
  field1: string;

  @IsString()
  field2: string;

  declare createdAt: Date;
  declare updatedAt: Date;
}

export class CreateYourEntityDTO {
  @IsString()
  @IsNotEmpty()
  field1: string;

  @IsString()
  field2: string;
}

export class UpdateYourEntityDTO {
  @IsString()
  field1?: string;

  @IsString()
  field2?: string;
}
```

### 5.2 Crear Controller

`src/modules/<MODULE>/presentation/<entity>.controller.ts`

**Template**:
```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { YourActionService } from '../application/services/<action>.service';
import type { IYourRepository } from '../domain/<entity>.repository';
import { YOUR_REPOSITORY_TOKEN } from '../domain/<entity>.repository';
import { YourEntityDTO, CreateYourEntityDTO } from './dtos/<entity>.dto';
import { YourEntityMapper } from '../application/mappers/<entity>.mapper';

@Controller('your-entities')
export class YourController {
  private mapper = new YourEntityMapper();

  constructor(
    private yourActionService: YourActionService,
    @Inject(YOUR_REPOSITORY_TOKEN)
    private repository: IYourRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateYourEntityDTO): Promise<YourEntityDTO> {
    await this.yourActionService.execute(dto);
    // Retornar el creado
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<YourEntityDTO | null> {
    const entity = await this.repository.findById(id);
    return entity ? this.mapper.toDTO(entity) : null;
  }

  @Get()
  async getAll(): Promise<YourEntityDTO[]> {
    const entities = await this.repository.findAll();
    return entities.map((e) => this.mapper.toDTO(e));
  }

  @Patch(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateYourEntityDTO,
  ): Promise<void> {
    // Implementar
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
```

---

## 6. Crear NestJS Module

`src/modules/<MODULE>/<module>.module.ts`

**Template**:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitter2 } from 'eventemitter2';

import { YourController } from './presentation/<entity>.controller';
import { YourActionService } from './application/services/<action>.service';
import { TypeOrmYourRepository } from './infrastructure/persistence/<entity>.repository';
import { YourEntitySchema } from './infrastructure/persistence/<entity>.schema';
import { YOUR_REPOSITORY_TOKEN } from './domain/<entity>.repository';
import { EventEmitterAdapter } from '../../shared/adapters/event-emitter.adapter';

@Module({
  imports: [TypeOrmModule.forFeature([YourEntitySchema])],
  controllers: [YourController],
  providers: [
    YourActionService,
    {
      provide: YOUR_REPOSITORY_TOKEN,
      useClass: TypeOrmYourRepository,
    },
    {
      provide: 'EventPublisher',
      useValue: new EventEmitterAdapter(new EventEmitter2()),
    },
  ],
  exports: [YOUR_REPOSITORY_TOKEN, YourActionService],
})
export class YourModule {}
```

---

## 7. Registrar Módulo en AppModule

`src/app.module.ts`

**Agregar**:
```typescript
import { YourModule } from './modules/<module>/<module>.module';

@Module({
  imports: [
    // ... otros imports
    YourModule,  // ← Agregar acá
  ],
})
export class AppModule {}
```

---

## 8. Escribir Tests (IMPORTANTE)

### 8.1 Tests de Dominio

`src/modules/<MODULE>/domain/__tests__/<entity>.spec.ts`

```typescript
import { YourEntity } from '../<entity>.entity';
import { CustomValue } from '../<entity>.entity';

describe('YourEntity', () => {
  describe('create', () => {
    it('should create with valid params', () => {
      const entity = YourEntity.create(new CustomValue('test'), 'data');
      expect(entity).toBeDefined();
      expect(entity.id).toBeDefined();
    });

    it('should emit CreatedEvent', () => {
      const entity = YourEntity.create(/* ... */);
      const events = entity.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(YourEntityCreatedEvent);
    });

    it('should throw if invalid params', () => {
      expect(() => YourEntity.create(new CustomValue(''), 'data')).toThrow();
    });
  });

  describe('someBusinessLogic', () => {
    it('should execute business logic', () => {
      const entity = YourEntity.create(/* ... */);
      entity.someBusinessLogic();
      // expect(entity.field).toBe(expectedValue);
    });
  });
});
```

### 8.2 Tests de Service

`src/modules/<MODULE>/application/__tests__/<action>.service.spec.ts`

```typescript
import { YourActionService } from '../services/<action>.service';

describe('YourActionService', () => {
  let service: YourActionService;
  let mockRepository: any;
  let mockEventPublisher: any;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    };
    mockEventPublisher = {
      publishMany: jest.fn(),
    };

    service = new YourActionService(mockRepository, mockEventPublisher);
  });

  it('should execute and publish events', async () => {
    await service.execute(/* dto */);

    expect(mockRepository.save).toHaveBeenCalled();
    expect(mockEventPublisher.publishMany).toHaveBeenCalled();
  });
});
```

### 8.3 Ejecutar Tests

```bash
npm test                    # Ejecutar todos
npm test -- --watch       # Watch mode
npm run test:cov          # Coverage
```

---

## 9. Checklist Final

- [ ] Domain layer creado y testado (✅ critical)
- [ ] Repository port definido
- [ ] Application service(s) implementado
- [ ] Mapper implementado
- [ ] TypeORM schema creado
- [ ] Repository implementation completada
- [ ] DTOs creados con validadores
- [ ] Controller implementado
- [ ] Módulo NestJS creado
- [ ] Registrado en AppModule
- [ ] Tests de dominio (✅ critical)
- [ ] Tests de service
- [ ] Compila sin errores: `npm run build`

---

## 10. Próximo Módulo

Una vez completado:
1. **Inventory** (ya hecho) ✅
2. **Auth** (siguiente)
3. **Customers**
4. **Orders** (más complejo)
5. etc...

Cada uno sigue este patrón exactamente.

---

## ❌ Errores Comunes

1. **Lógica de negocio en service**: ❌ Va en domain
   ```typescript
   // ❌ MAL
   service.execute() {
     if (qty > 100) { ... } // ← Lógica
   }

   // ✅ BIEN
   entity.reserveStock() {
     if (!available.isGreaterThan(qty)) throw Error() // ← Lógica
   }
   ```

2. **Exponer agregados en HTTP**: ❌ Siempre usa DTO
   ```typescript
   // ❌ MAL
   @Get(':id')
   getById(id: string): YourEntity { return this.repo.findById(id); }

   // ✅ BIEN
   @Get(':id')
   getById(id: string): YourEntityDTO {
     const entity = await this.repo.findById(id);
     return this.mapper.toDTO(entity);
   }
   ```

3. **Acoplamiento entre módulos**: ❌ Usa eventos
   ```typescript
   // ❌ MAL
   constructor(private ordersRepo: IOrdersRepository) {}
   // Ahora Orders y Inventory están acoplados

   // ✅ BIEN
   eventSubscriber.subscribe('order.created', async (event) => {
     // Reaccionar sin conocer detalles
   });
   ```

---

**Ahora estás listo. Siguiente módulo: Auth.**

