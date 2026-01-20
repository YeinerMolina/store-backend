# Guía de Arquitectura Hexagonal para el Proyecto

## 🎯 Visión General

Este proyecto implementa **Arquitectura Hexagonal (Ports & Adapters)** combinada con **Domain-Driven Design (DDD)**. Este documento es la guía maestra para entender y trabajar con esta arquitectura.

## 📐 Estructura Global del Proyecto

```
store-backend/
├── src/
│   ├── shared/                      ← Código compartido entre módulos
│   │   ├── domain/
│   │   │   ├── value-objects/      ← UUID, Money, etc.
│   │   │   └── events/             ← Clase base EventoDominio
│   │   └── infrastructure/
│   │       └── persistence/        ← Configuración PrismaClient
│   │
│   └── modules/                     ← 11 Bounded Contexts
│       ├── identidad/
│       ├── catalogo/
│       ├── inventario/
│       ├── pre-venta/
│       ├── comercial/              ← Ejemplo completo implementado
│       ├── logistica/
│       ├── fiscal/
│       ├── comunicacion/
│       ├── configuracion/
│       ├── seguridad/
│       └── auditoria/
│
├── prisma/
│   └── schema.prisma               ← Esquema de base de datos
│
└── scripts/
    └── create-hexagonal-module.sh  ← Helper para crear módulos
```

## 🏗️ Estructura de un Módulo Hexagonal

Cada módulo sigue esta estructura exacta:

```
{modulo}/
├── domain/                          ← CAPA 1: NÚCLEO (sin dependencias)
│   ├── aggregates/                 ← Agregados DDD
│   │   ├── {agregado}.aggregate.ts
│   │   └── {entidad}.entity.ts
│   │
│   ├── value-objects/              ← Value Objects inmutables
│   │   └── {vo}.vo.ts
│   │
│   ├── ports/                      ← INTERFACES (contratos)
│   │   ├── inbound/               ← Casos de uso (QUÉ expone el módulo)
│   │   │   └── i-{servicio}.service.ts
│   │   │
│   │   └── outbound/              ← Dependencias (QUÉ necesita el módulo)
│   │       ├── i-{repositorio}-repository.port.ts
│   │       └── i-{modulo-externo}.port.ts
│   │
│   └── events/                     ← Eventos de dominio
│       └── {evento}.event.ts
│
├── application/                     ← CAPA 2: ORQUESTACIÓN
│   ├── services/                   ← Implementan puertos inbound
│   │   └── {servicio}.service.ts
│   │
│   ├── dto/                        ← Data Transfer Objects
│   │   └── {operacion}.dto.ts
│   │
│   └── mappers/                    ← Transformaciones Domain ↔ DTO
│       └── {entidad}.mapper.ts
│
├── infrastructure/                  ← CAPA 3: ADAPTADORES
│   ├── persistence/                ← Adaptadores de persistencia
│   │   ├── prisma-{repo}.repository.ts
│   │   └── mappers/
│   │       └── {entidad}-persistence.mapper.ts
│   │
│   ├── adapters/                   ← Adaptadores a otros módulos
│   │   └── {modulo}.adapter.ts
│   │
│   └── controllers/                ← Adaptadores HTTP (NestJS)
│       └── {controlador}.controller.ts
│
├── {modulo}.module.ts              ← Módulo NestJS (DI)
└── README.md                        ← Documentación del módulo
```

## 🔄 Flujo de Dependencias

### Regla de Oro: Las Dependencias Apuntan HACIA ADENTRO

```
┌─────────────────────────────────────────────┐
│         INFRASTRUCTURE                      │ ← Capa Externa
│  (Controllers, Adapters, Repositories)      │
│                                             │
│  Depende de ↓                               │
└──────────────┬──────────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────────┐
│         APPLICATION                          │ ← Capa Media
│       (Services, DTOs)                       │
│                                              │
│  Depende de ↓                                │
└──────────────┬───────────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────────┐
│           DOMAIN                             │ ← Capa Interna (NÚCLEO)
│  (Aggregates, Value Objects, Ports, Events)  │
│                                              │
│  NO DEPENDE DE NADA ✅                       │
└──────────────────────────────────────────────┘
```

### Reglas Estrictas

```
✅ PERMITIDO:
  domain/        → [NADA]
  application/   → domain/
  infrastructure → domain/ + application/

❌ PROHIBIDO:
  domain/        → application/  ❌ NUNCA
  domain/        → infrastructure/ ❌ NUNCA
  application/   → infrastructure/ ❌ NUNCA
```

## 🎨 Inversión de Dependencias con Puertos

### El Problema que Resuelve

**SIN Hexagonal (dependencia directa):**

```typescript
// ❌ MAL: Dominio depende de infraestructura
class VentaService {
  constructor(private prisma: PrismaClient) {} // Acoplamiento directo

  async crear() {
    await this.prisma.venta.create({ ... }); // Dominio conoce Prisma
  }
}
```

**CON Hexagonal (inversión de dependencias):**

```typescript
// ✅ BIEN: Dominio define interfaz (puerto)
// domain/ports/outbound/i-venta-repository.port.ts
export interface IVentaRepository {
  save(venta: Venta): Promise<void>;
}

// application/services/venta.service.ts
class VentaService {
  constructor(private repo: IVentaRepository) {} // Depende de interfaz

  async crear() {
    await this.repo.save(venta); // No conoce la implementación
  }
}

// infrastructure/persistence/prisma-venta.repository.ts
class PrismaVentaRepository implements IVentaRepository {
  constructor(private prisma: PrismaClient) {}

  async save(venta: Venta) {
    // Implementación con Prisma
  }
}
```

### Puertos Inbound vs Outbound

```
                    ┌─────────────────┐
                    │   Controller    │ (Adaptador Primario)
                    └────────┬────────┘
                             │ usa
                             ↓
                    ┌─────────────────┐
   INBOUND ─────────│  IVentaService  │ (Puerto de Entrada)
                    └────────┬────────┘
                             │ implementa
                             ↓
                    ┌─────────────────┐
                    │  VentaService   │ (Application Service)
                    └────────┬────────┘
                             │ usa
                             ↓
            ┌────────────────────────────────┐
            │                                │
            ↓                                ↓
   ┌─────────────────┐          ┌─────────────────────┐
   │IVentaRepository │          │  IInventarioPort    │ (Puertos de Salida)
   └────────┬────────┘          └──────────┬──────────┘
            │ implementa                   │ implementa
            ↓                              ↓
   ┌─────────────────┐          ┌─────────────────────┐
OUTBOUND │PrismaVentaRepo│          │ InventarioAdapter   │ (Adaptadores Secundarios)
   └─────────────────┘          └─────────────────────┘
```

## 📦 Agregados DDD en Hexagonal

### Definición de Agregado

Un agregado es un cluster de objetos de dominio (entidad raíz + entidades hijas + value objects) que se tratan como una unidad para cambios de datos.

### Ejemplo: Agregado Venta

```typescript
// domain/aggregates/venta.aggregate.ts
export class Venta {
  // Estado privado
  private props: VentaProps;
  private lineas: LineaVenta[] = [];
  private eventos: EventoDominio[] = [];

  // Constructor privado (Factory Methods públicos)
  private constructor(props: VentaProps) { ... }

  // Factory Method
  static crear(params): Venta {
    // Validar INVARIANTES
    if (params.lineas.length === 0) {
      throw new Error('Debe tener al menos una línea');
    }

    const venta = new Venta({ ... });

    // Emitir evento de dominio
    venta.eventos.push(new VentaCreada(venta.id));

    return venta;
  }

  // Métodos de negocio (NO setters tontos)
  confirmar(): void {
    // Validar precondiciones
    if (this.estado !== EstadoVenta.BORRADOR) {
      throw new Error('Solo se pueden confirmar ventas en borrador');
    }

    // Aplicar cambio
    this.estado = EstadoVenta.CONFIRMADA;
    this.fechaConfirmacion = new Date();

    // Emitir evento
    this.eventos.push(new VentaConfirmada(this.id));
  }

  // Getters (NO exponer estado mutable)
  getId(): UUID {
    return this.props.id;
  }

  getEventos(): EventoDominio[] {
    return [...this.eventos]; // Copia defensiva
  }
}
```

### Invariantes del Agregado

Los agregados **GARANTIZAN** sus invariantes (reglas de negocio):

```typescript
// ✅ BIEN: Invariante protegida por el agregado
class Venta {
  confirmar() {
    if (this.estado !== EstadoVenta.BORRADOR) {
      throw new Error('...');
    }
    // ... cambio de estado
  }
}

// ❌ MAL: Invariante no protegida
class Venta {
  estado: EstadoVenta; // público, cualquiera puede cambiar
}

// Desde afuera:
venta.estado = EstadoVenta.CONFIRMADA; // ❌ Saltea lógica de negocio
```

## 🔌 Inyección de Dependencias con NestJS

### Configuración del Módulo

```typescript
// {modulo}.module.ts
@Module({
  controllers: [VentaController],
  providers: [
    // Puertos Inbound → Implementaciones
    {
      provide: 'IVentaService',
      useClass: VentaService,
    },

    // Puertos Outbound → Implementaciones
    {
      provide: 'IVentaRepository',
      useClass: PrismaVentaRepository,
    },
    {
      provide: 'IInventarioPort',
      useClass: InventarioAdapter, // ← Cambiable
    },
    {
      provide: 'ICatalogoPort',
      useClass: CatalogoAdapter,
    },
  ],
  exports: ['IVentaService'], // Exportar para otros módulos
})
export class ComercialModule {}
```

### Cambiar Implementación SIN Tocar Dominio

```typescript
// Hoy: Comunicación HTTP
{
  provide: 'IInventarioPort',
  useClass: InventarioHttpAdapter,
}

// Mañana: Comunicación por Eventos
{
  provide: 'IInventarioPort',
  useClass: InventarioEventAdapter, // ← Solo cambiamos esto
}

// El dominio y application NO cambian ✅
```

## 📝 Mappers: Separación de Modelos

### Mapper de Persistencia (Domain ↔ Prisma)

```typescript
// infrastructure/persistence/mappers/venta-persistence.mapper.ts
export class VentaPersistenceMapper {
  // Domain → Prisma
  static toPrisma(venta: Venta): PrismaVentaCreateInput {
    return {
      id: venta.getId().toString(),
      cliente_id: venta.getClienteId().toString(),
      estado: venta.getEstado(),
      total: venta.getTotal().getAmount(),
      // ... todos los campos
    };
  }

  // Prisma → Domain
  static toDomain(prismaVenta: PrismaVenta): Venta {
    // Reconstruir agregado desde datos de BD
    // IMPORTANTE: No llamar a factory methods (ya está creado)
    return Venta.reconstruct({
      id: UUID.fromString(prismaVenta.id),
      // ... todos los campos
    });
  }
}
```

### Mapper de DTO (Domain ↔ API)

```typescript
// application/mappers/venta.mapper.ts
export class VentaMapper {
  static toDto(venta: Venta): VentaDto {
    return {
      id: venta.getId().toString(),
      estado: venta.getEstado(),
      total: venta.getTotal().getAmount(),
      moneda: venta.getTotal().getCurrency(),
    };
  }
}
```

## 🧪 Testing en Hexagonal

### Unit Tests (Dominio - SIN Mocks)

```typescript
describe('Venta Aggregate', () => {
  it('debe crear venta válida', () => {
    const venta = Venta.crear({
      lineas: [lineaValida],
      // ...
    });

    expect(venta.getEstado()).toBe(EstadoVenta.BORRADOR);
    expect(venta.getLineas()).toHaveLength(1);
  });

  it('debe fallar si no hay líneas', () => {
    expect(() => {
      Venta.crear({ lineas: [] });
    }).toThrow('Debe tener al menos una línea');
  });
});
```

**NO se usan mocks** - El dominio es puro.

### Integration Tests (Application - CON Mocks de Puertos)

```typescript
describe('VentaService', () => {
  let service: VentaService;
  let mockRepo: jest.Mocked<IVentaRepository>;
  let mockInventario: jest.Mocked<IInventarioPort>;

  beforeEach(() => {
    mockRepo = {
      save: jest.fn(),
      findById: jest.fn(),
    } as any;

    mockInventario = {
      verificarDisponibilidad: jest.fn().mockResolvedValue(true),
      reservar: jest.fn().mockResolvedValue(UUID.create()),
    } as any;

    service = new VentaService(mockRepo, mockInventario, ...);
  });

  it('debe crear venta desde carrito', async () => {
    await service.crearDesdeCarrito(carritoId, clienteId);

    expect(mockInventario.reservar).toHaveBeenCalled();
    expect(mockRepo.save).toHaveBeenCalled();
  });
});
```

**Mockeamos PUERTOS (interfaces)**, no implementaciones concretas.

### E2E Tests (Infraestructura - Base de Datos Real)

```typescript
describe('Venta E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ComercialModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('POST /ventas debe crear venta', async () => {
    const response = await request(app.getHttpServer())
      .post('/ventas')
      .send({ carritoId: '...', clienteId: '...' })
      .expect(201);

    expect(response.body.ventaId).toBeDefined();
  });
});
```

## 🚀 Flujo Completo de una Operación

**Ejemplo: Crear Venta desde Carrito**

1. **HTTP Request** → `POST /ventas`

2. **VentaController** (adaptador primario)

   ```typescript
   @Post()
   async crear(@Body() dto: CrearVentaDto) {
     return this.ventaService.crearDesdeCarrito(...);
   }
   ```

3. **VentaService** (application service)

   ```typescript
   async crearDesdeCarrito(carritoId, clienteId) {
     // Verificar disponibilidad (puerto outbound)
     const disponible = await this.inventarioPort.verificar(...);

     // Obtener precios (puerto outbound)
     const precios = await this.catalogoPort.obtenerPrecios(...);

     // Crear agregado (dominio puro)
     const venta = Venta.crear({ ... });

     // Persistir (puerto outbound)
     await this.ventaRepo.save(venta);

     // Publicar eventos (puerto outbound)
     await this.eventBus.publish(venta.getEventos());
   }
   ```

4. **Adaptadores** (implementaciones)
   - `InventarioAdapter` → Llama a módulo INVENTARIO
   - `CatalogoAdapter` → Llama a módulo CATALOGO
   - `PrismaVentaRepository` → Guarda en BD
   - `EventBusAdapter` → Publica a Redis/RabbitMQ

5. **HTTP Response** → 201 Created con datos de la venta

## 📋 Checklist para Crear un Módulo

- [ ] Leer `{MODULO}_CLAUDE.md` (lógica de negocio)
- [ ] Leer `{MODULO}_ENTITIES_CLAUDE.md` (entidades)
- [ ] Ejecutar `./scripts/create-hexagonal-module.sh {modulo}`

**DOMAIN:**

- [ ] Crear agregados en `domain/aggregates/`
- [ ] Crear value objects en `domain/value-objects/`
- [ ] Definir puertos inbound en `domain/ports/inbound/`
- [ ] Definir puertos outbound en `domain/ports/outbound/`
- [ ] Crear eventos en `domain/events/`

**APPLICATION:**

- [ ] Implementar servicios en `application/services/`
- [ ] Crear DTOs en `application/dto/`
- [ ] Crear mappers en `application/mappers/`

**INFRASTRUCTURE:**

- [ ] Implementar repositorios en `infrastructure/persistence/`
- [ ] Crear mappers de persistencia
- [ ] Implementar adaptadores a otros módulos
- [ ] Crear controllers HTTP

**NESTJS:**

- [ ] Configurar módulo con DI
- [ ] Escribir tests unitarios (dominio)
- [ ] Escribir tests de integración (application)
- [ ] Escribir tests E2E

## 🎓 Principios Clave a Recordar

1. **El dominio es PURO** - Sin dependencias externas
2. **Puertos = Contratos** - Interfaces, no implementaciones
3. **Agregados protegen invariantes** - Lógica de negocio en el dominio
4. **Inyección por interfaces** - Cambiar implementaciones fácilmente
5. **Eventos de dominio** - Comunicación desacoplada entre módulos
6. **Mappers bidireccionales** - Separación modelo dominio/persistencia
7. **Tests sin mocks en dominio** - Lógica pura
8. **Tests con mocks de puertos** - Orquestación aislada

## 📚 Referencias

- [Hexagonal Architecture - Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)
- [Domain-Driven Design - Eric Evans](https://www.domainlanguage.com/ddd/)
- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Implementing DDD - Vaughn Vernon](https://vaughnvernon.com/)
