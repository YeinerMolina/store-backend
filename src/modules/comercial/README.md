# Módulo COMERCIAL - Hexagonal Architecture

Este módulo implementa **Arquitectura Hexagonal (Ports & Adapters)** con **Domain-Driven Design**.

## 📐 Estructura del Módulo

```
comercial/
├── domain/                          ← NÚCLEO HEXAGONAL (capa interna)
│   ├── aggregates/                 ← Lógica de negocio PURA
│   │   ├── venta.aggregate.ts      ← Agregado raíz con invariantes
│   │   └── linea-venta.entity.ts   ← Entidad hija del agregado
│   ├── value-objects/              ← Objetos de valor inmutables
│   ├── ports/                      ← CONTRATOS (interfaces)
│   │   ├── inbound/               ← Lo que el módulo EXPONE
│   │   │   └── i-venta.service.ts
│   │   └── outbound/              ← Lo que el módulo NECESITA
│   │       ├── i-venta-repository.port.ts
│   │       ├── i-inventario.port.ts
│   │       ├── i-catalogo.port.ts
│   │       └── i-event-bus.port.ts
│   └── events/                     ← Eventos de dominio
│       ├── venta-creada.event.ts
│       └── venta-confirmada.event.ts
│
├── application/                     ← CAPA DE APLICACIÓN (orquestación)
│   ├── services/
│   │   └── venta.service.ts        ← Implementa puerto inbound
│   ├── dto/                        ← Objetos de transferencia
│   └── mappers/                    ← Transformaciones entre capas
│
└── infrastructure/                  ← ADAPTADORES (capa externa)
    ├── persistence/
    │   ├── prisma-venta.repository.ts  ← Implementa IVentaRepository
    │   └── mappers/
    │       └── venta-persistence.mapper.ts
    ├── adapters/                   ← Adaptadores a otros módulos
    │   ├── inventario.adapter.ts   ← Implementa IInventarioPort
    │   ├── catalogo.adapter.ts     ← Implementa ICatalogoPort
    │   └── event-bus.adapter.ts    ← Implementa IEventBusPort
    └── controllers/
        └── venta.controller.ts     ← Adaptador HTTP (NestJS)
```

## 🎯 Principios de Arquitectura Hexagonal

### 1. El Dominio es el Centro (y NO conoce a nadie)

El dominio (`domain/`) tiene **CERO** dependencias externas:

```typescript
// ✅ BIEN: Dominio puro
export class Venta {
  confirmar(): void {
    if (this.estado !== EstadoVenta.BORRADOR) {
      throw new Error('No se puede confirmar');
    }
    this.estado = EstadoVenta.CONFIRMADA;
  }
}

// ❌ MAL: Dominio conociendo infraestructura
import { PrismaClient } from '@prisma/client'; // ❌ NO!
```

### 2. Puertos = Contratos (Interfaces)

Los puertos definen **QUÉ** necesita el módulo, no **CÓMO** se implementa:

```typescript
// Puerto (domain/ports/outbound/i-inventario.port.ts)
export interface IInventarioPort {
  verificarDisponibilidad(itemId: UUID): Promise<boolean>;
}

// Implementación 1: HTTP
class InventarioHttpAdapter implements IInventarioPort {
  async verificarDisponibilidad(itemId: UUID) {
    return this.http.get(`/inventario/${itemId}`);
  }
}

// Implementación 2: In-process
class InventarioInProcessAdapter implements IInventarioPort {
  async verificarDisponibilidad(itemId: UUID) {
    return this.inventarioService.verificar(itemId);
  }
}
```

### 3. Adaptadores = Implementaciones Concretas

Los adaptadores traducen entre el dominio y el mundo exterior:

```
┌─────────────────────────────────────────────┐
│           ADAPTADORES PRIMARIOS             │
│         (Driving Adapters - Input)          │
│                                             │
│  HTTP REST API   │  GraphQL  │  CLI  │ gRPC│
│  (controllers)                              │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
        ┌──────────────────────┐
        │   PUERTOS INBOUND    │
        │   (IVentaService)    │
        └──────────┬───────────┘
                   │
                   ↓
        ┌──────────────────────┐
        │   APPLICATION        │
        │   (VentaService)     │
        └──────────┬───────────┘
                   │
                   ↓
        ┌──────────────────────┐
        │      DOMINIO         │
        │  (Venta Aggregate)   │
        │   LÓGICA PURA        │
        └──────────┬───────────┘
                   │
                   ↓
        ┌──────────────────────┐
        │   PUERTOS OUTBOUND   │
        │   (Interfaces)       │
        └──────────┬───────────┘
                   │
                   ↓
┌──────────────────────────────────────────────┐
│         ADAPTADORES SECUNDARIOS              │
│        (Driven Adapters - Output)            │
│                                              │
│  Prisma  │  HTTP  │  Redis  │  RabbitMQ     │
│  (persistence, external services)            │
└──────────────────────────────────────────────┘
```

## 🔄 Flujo de una Operación

**Ejemplo: Crear Venta desde Carrito**

1. **HTTP Request** llega a `VentaController` (adaptador primario)
2. **Controller** llama a `IVentaService` (puerto inbound)
3. **VentaService** (application) orquesta:
   - Llama a `IInventarioPort.verificarDisponibilidad()` (puerto outbound)
   - `InventarioAdapter` ejecuta la llamada real (adaptador secundario)
   - Llama a `ICatalogoPort.obtenerPrecios()` (puerto outbound)
   - `CatalogoAdapter` ejecuta la llamada real (adaptador secundario)
4. **VentaService** crea el agregado `Venta.crear()` (dominio)
5. **Venta** aplica invariantes y emite eventos (lógica pura)
6. **VentaService** persiste usando `IVentaRepository.save()` (puerto outbound)
7. **PrismaVentaRepository** guarda en BD (adaptador secundario)
8. **Controller** retorna HTTP Response

## 🧪 Testeo con Hexagonal

### Unit Tests (Dominio)

```typescript
describe('Venta Aggregate', () => {
  it('debe confirmar venta en estado BORRADOR', () => {
    const venta = Venta.crear({ ... });

    venta.confirmar();

    expect(venta.getEstado()).toBe(EstadoVenta.CONFIRMADA);
  });

  it('debe lanzar error si confirma venta ya confirmada', () => {
    const venta = Venta.crear({ ... });
    venta.confirmar();

    expect(() => venta.confirmar()).toThrow();
  });
});
```

**SIN MOCKS** - El dominio es puro.

### Integration Tests (Application)

```typescript
describe('VentaService', () => {
  it('debe crear venta desde carrito', async () => {
    // Mocks de puertos outbound
    const mockInventario: IInventarioPort = {
      verificarDisponibilidad: jest.fn().mockResolvedValue(true),
      reservar: jest.fn().mockResolvedValue(UUID.create()),
    };

    const mockCatalogo: ICatalogoPort = {
      obtenerPrecios: jest.fn().mockResolvedValue(Money.fromAmount(100)),
    };

    const service = new VentaService(
      mockRepo,
      mockInventario,
      mockCatalogo,
      mockEventBus,
    );

    await service.crearDesdeCarrito(carritoId, clienteId);

    expect(mockInventario.reservar).toHaveBeenCalled();
  });
});
```

**CON MOCKS** - Mockeamos puertos (interfaces), no implementaciones.

## 📋 Reglas de Dependencia

```
✅ PERMITIDO:
  domain/        → NADA (cero dependencias)
  application/   → domain/
  infrastructure → domain/ + application/

❌ PROHIBIDO:
  domain/        → application/  ❌
  domain/        → infrastructure/ ❌
  application/   → infrastructure/ ❌
```

## 🔧 Inyección de Dependencias (NestJS)

En `comercial.module.ts`:

```typescript
@Module({
  providers: [
    // Puerto inbound → Implementación
    {
      provide: 'IVentaService',
      useClass: VentaService,
    },

    // Puerto outbound → Implementación
    {
      provide: 'IInventarioPort',
      useClass: InventarioAdapter, // ← Cambiable sin tocar dominio
    },
  ],
})
```

Para cambiar de HTTP a eventos:

```typescript
{
  provide: 'IInventarioPort',
  useClass: InventarioEventAdapter, // ← Solo cambias esto
}
```

**El dominio y la aplicación NO cambian.**

## 🚀 Ventajas de esta Arquitectura

1. **Testeable**: Dominio sin mocks, servicios con mocks de puertos
2. **Flexible**: Cambias adaptadores sin tocar dominio
3. **Independiente de Frameworks**: NestJS está en infraestructura
4. **Independiente de BD**: Prisma está en infraestructura
5. **Reglas de Negocio Claras**: Todo en el dominio, visible
6. **Fácil de mantener**: Cada capa tiene responsabilidad única

## 📚 Referencias

- Arquitectura Hexagonal: https://alistair.cockburn.us/hexagonal-architecture/
- DDD: Domain-Driven Design (Eric Evans)
- Clean Architecture (Robert C. Martin)
