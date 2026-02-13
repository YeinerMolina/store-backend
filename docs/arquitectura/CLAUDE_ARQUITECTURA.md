# 🏗️ Arquitectura del Proyecto - Guía Rápida

**Versión**: 2.1  
**Fecha**: Febrero 2026  
**Propósito**: Punto de entrada arquitectónico para desarrolladores y agentes IA

---

## 📌 Visión General

Este proyecto implementa **Arquitectura Hexagonal (Ports & Adapters)** combinada con **Domain-Driven Design (DDD)**. Este documento resume los conceptos clave y te dirige a la documentación detallada cuando necesites profundizar.

---

## 📚 Documentos de Arquitectura Disponibles

### 1. **ARQUITECTURA_HEXAGONAL.md** (⭐ Leer Primero)

**Propósito**: Guía maestra completa de arquitectura hexagonal con ejemplos prácticos.

**Cubre**:

- ✅ Estructura detallada de cada módulo (domain, application, infrastructure)
- ✅ Flujo de dependencias (siempre hacia adentro)
- ✅ Puertos inbound vs outbound con ejemplos
- ✅ **Organización de puertos outbound** (repositories, external, integrations)
- ✅ **Tabla de decisión: ¿Dónde va cada archivo?**
- ✅ Agregados DDD y repositorios (un agregado = un repository)
- ✅ Convenciones de nombres (sin prefijo "I" en interfaces)
- ✅ API declarativa para entidades internas
- ✅ Inversión de dependencias con NestJS
- ✅ Types del dominio vs DTOs de aplicación
- ✅ **Separación de types**: `domain/types/` (compartidos) vs `domain/aggregates/*/types.ts` (internos)
- ✅ Mappers entre capas (Domain ↔ Prisma, Domain ↔ DTO)
- ✅ Testing en hexagonal (unit, integration, e2e)
- ✅ Patrones completos de código

**Cuándo leer**:

- Al iniciar trabajo en el proyecto
- Al crear un módulo nuevo
- Al tener dudas sobre dónde ubicar un archivo
- Al implementar puertos, adaptadores o repositorios

**Ejemplo de contenido clave**:

```typescript
// Reglas de Dependencia (STRICT)
✅ PERMITIDO:
  domain/         → [NADA]  (sin dependencias externas)
  application/    → domain/
  infrastructure/ → domain/ + application/

❌ PROHIBIDO:
  domain/         → application/    NUNCA
  domain/         → infrastructure/ NUNCA
  application/    → infrastructure/ NUNCA
```

---

### 2. **ARQUITECTURA_DIAGRAMA.md** (Visual)

**Propósito**: Visualizaciones ASCII de la arquitectura para entender flujos y relaciones.

**Cubre**:

- 🎨 Hexágono completo con adaptadores primarios y secundarios
- 🔄 Flujo de datos completo: crear venta desde carrito (13 pasos)
- 🏢 Diagrama de dependencias entre los 11 módulos
- 🔌 Ejemplo de inyección de dependencias con NestJS
- 🧪 Pirámide de testing hexagonal (unit, integration, e2e)
- 📦 Agregados y boundaries transaccionales
- 🎯 Separación de tres modelos (Domain, Prisma, DTO)
- 📋 Flujo de transformación de Types a DTOs

**Cuándo consultar**:

- Al necesitar entender visualmente el flujo de una operación
- Al explicar arquitectura a otro desarrollador
- Al diseñar integraciones entre módulos
- Al planificar testing

**Ejemplo de diagrama incluido**:

```
                     ┌───────────────┐
                     │  Controller   │ (HTTP)
                     └───────┬───────┘
                             ↓
                     ┌───────────────┐
    INBOUND ────────│ VentaService  │ (Puerto de Entrada)
                     └───────┬───────┘
                             ↓
                     ┌───────────────────────┐
                     │ VentaApplicationService│
                     └───────┬───────────────┘
                             ↓
              ┌──────────────┴──────────────┐
              ↓                             ↓
    ┌─────────────────┐          ┌─────────────────┐
    │VentaRepository  │          │ InventarioPort  │
    └────────┬────────┘          └────────┬────────┘
             ↓                            ↓
    ┌──────────────────┐        ┌─────────────────┐
OUTBOUND VentaPostgresRepo    InventarioHttpAdapter
```

---

### 3. **DECORADORES_PERSONALIZADOS.md** (Patrones NestJS)

**Propósito**: Guía de decoradores personalizados para reutilizar lógica transversal.

**Cubre**:

- ✅ Principios de composabilidad y responsabilidad única
- ✅ Decoradores disponibles (`@ValidateWith`, `@RequireRole`, `@RateLimit`)
- ✅ Cómo crear decoradores personalizados (template + ejemplos)
- ✅ Orden de aplicación y composición
- ✅ Errores comunes y cómo evitarlos
- ✅ Testing de decoradores
- ✅ Organización de archivos

**Cuándo consultar**:

- Al validar entrada en controllers
- Al implementar autorización/autenticación
- Al agregar lógica transversal (auditoría, rate limiting)
- Al crear un decorador personalizado nuevo

**Ejemplo de decorador**:

```typescript
/**
 * Applies Zod schema validation to a handler.
 * Combines with @UsePipes internally to keep handler signatures clean.
 *
 * Side effects:
 * - Validation errors throw BadRequestException with formatted Zod issues
 *
 * @param schema - Zod schema for validating request body/query/params
 */
export function ValidateWith(schema: ZodSchema) {
  return applyDecorators(UsePipes(new ZodValidationPipe(schema)));
}

// Uso:
@Post('crear')
@ValidateWith(CrearInventarioSchema)
async crear(@Body() dto: CrearInventarioDto) { }
```

---

## 🎯 Guía Rápida: ¿Qué Documento Leo?

| Necesito...                                                | Lee este documento            |
| ---------------------------------------------------------- | ----------------------------- |
| Entender estructura de módulos                             | ARQUITECTURA_HEXAGONAL.md     |
| **Saber dónde va un archivo (tabla decisión)**             | **ARQUITECTURA_HEXAGONAL.md** |
| Crear un puerto o adaptador                                | ARQUITECTURA_HEXAGONAL.md     |
| **Organizar ports outbound (repos/external/integrations)** | **ARQUITECTURA_HEXAGONAL.md** |
| Entender agregados DDD                                     | ARQUITECTURA_HEXAGONAL.md     |
| **Separar types compartidos vs internos**                  | **ARQUITECTURA_HEXAGONAL.md** |
| Ver flujo de datos visualmente                             | ARQUITECTURA_DIAGRAMA.md      |
| Entender dependencias entre módulos                        | ARQUITECTURA_DIAGRAMA.md      |
| Validar entrada en controller                              | DECORADORES_PERSONALIZADOS.md |
| Crear decorador personalizado                              | DECORADORES_PERSONALIZADOS.md |
| Implementar autorización con decoradores                   | DECORADORES_PERSONALIZADOS.md |

---

## 🚀 Inicio Rápido: Implementar un Módulo Nuevo

### Paso 1: Leer Documentación de Dominio

```bash
# 1. Leer lógica de negocio
cat src/modules/{modulo}/{MODULO}_CLAUDE.md

# 2. Leer entidades de BD
cat src/modules/{modulo}/{MODULO}_ENTITIES_CLAUDE.md
```

### Paso 2: Revisar Arquitectura Hexagonal

```bash
# 3. Entender estructura hexagonal
cat docs/arquitectura/ARQUITECTURA_HEXAGONAL.md
```

### Paso 3: Ver Módulo de Referencia

```bash
# 4. Revisar implementación de INVENTARIO (módulo de referencia completo)
ls -la src/modules/inventario/
```

### Paso 4: Implementar Capas en Orden

**Orden recomendado** (siempre de adentro hacia afuera):

1. **DOMAIN** (núcleo puro, sin dependencias)
   - `domain/aggregates/` - Entidades y agregados
   - `domain/value-objects/` - Value Objects inmutables
   - `domain/ports/inbound/` - Casos de uso (qué expone)
   - `domain/ports/outbound/repositories/` - Persistencia
   - `domain/ports/outbound/external/` - Servicios técnicos (email, JWT)
   - `domain/ports/outbound/integrations/` - Otros módulos
   - `domain/types/` - Contratos de datos compartidos
   - `domain/events/` - Eventos de dominio
   - `domain/factories/` - Creación de agregados con UUID v7
   - `domain/exceptions/` - Errores de dominio

2. **APPLICATION** (orquestación)
   - `application/dto/` - DTOs + Zod schemas
   - `application/mappers/` - Domain ↔ DTO
   - `application/services/` - Implementación de casos de uso

3. **INFRASTRUCTURE** (adaptadores)
   - `infrastructure/persistence/repositories/` - Repositorios Prisma
   - `infrastructure/persistence/mappers/` - Domain ↔ Prisma
   - `infrastructure/adapters/` - Adaptadores a otros módulos
   - `infrastructure/controllers/` - Controllers HTTP con decoradores
   - `infrastructure/{modulo}.module.ts` - Módulo NestJS con DI

---

## 📋 Checklist de Arquitectura

Al implementar o revisar un módulo, verificar:

### Domain Layer

- [ ] Sin imports de `application/` o `infrastructure/`
- [ ] Agregados con invariantes protegidas (métodos, NO setters públicos)
- [ ] Factories para creación (con UUID v7 desde `IdGenerator.generate()`)
- [ ] Value Objects inmutables
- [ ] Puertos inbound/outbound sin implementación
- [ ] **Puertos outbound organizados**:
  - [ ] `repositories/` para persistencia
  - [ ] `external/` para servicios técnicos
  - [ ] `integrations/` para otros módulos
  - [ ] Cada subcarpeta con `index.ts` (barrel export)
- [ ] **Types organizados**:
  - [ ] `domain/types/` para contratos compartidos entre puertos
  - [ ] `domain/aggregates/{agregado}/*.types.ts` para contratos internos
- [ ] Tokens DI en `domain/ports/tokens.ts` (NO en infrastructure)
- [ ] Eventos de dominio emitidos en cambios de estado
- [ ] Excepciones de dominio para reglas de negocio

### Application Layer

- [ ] Services implementan puertos inbound
- [ ] Solo dependen de `domain/`
- [ ] DTOs con tipos primitivos (string, number, boolean)
- [ ] Schemas Zod 4 para validación
- [ ] Mappers Domain ↔ DTO

### Infrastructure Layer

- [ ] Repositorios implementan puertos outbound
- [ ] Mappers Domain ↔ Prisma (persistencia)
- [ ] Adaptadores a otros módulos (HTTP, eventos)
- [ ] Controllers con decoradores (`@ValidateWith`, etc.)
- [ ] Módulo NestJS con inyección de dependencias correcta

---

## 🎓 Conceptos Clave a Recordar

### 1. Regla de Oro: Dependencias Hacia Adentro

```
domain ← application ← infrastructure
```

### 2. Un Agregado = Un Repository

Las entidades internas (child entities) NO tienen repositories propios.

### 3. Tres Modelos Separados

- **Domain**: Lógica rica (Money, Cantidad, invariantes)
- **Prisma**: Optimizado para BD (snake_case, índices)
- **DTO**: Optimizado para API (JSON, primitivos)

### 4. Factories para IDs

```typescript
// ✅ CORRECTO
const inventario = InventarioFactory.crear(props); // ID generado por factory

// ❌ INCORRECTO
const inventario = new Inventario(); // ID generado en constructor
```

### 5. Puertos sin Prefijo "I"

```typescript
// ✅ CORRECTO
export interface VentaRepository { ... }

// ❌ INCORRECTO (convención C#/Java antigua)
export interface IVentaRepository { ... }
```

### 6. Adaptadores con Sufijo Técnico

```typescript
// ✅ CORRECTO
export class VentaPostgresRepository implements VentaRepository { ... }
export class InventarioHttpAdapter implements InventarioPort { ... }

// ❌ INCORRECTO
export class VentaRepositoryImpl { ... } // "Impl" no dice nada
```

---

## 🔗 Referencias Cruzadas

- **Módulo de ejemplo completo**: `src/modules/inventario/`
- **Guía UUID v7**: `docs/patrones/UUID_V7_GUIDE.md`
- **Guía Swagger**: `docs/patrones/SWAGGER_INTEGRATION_GUIDE.md`
- **Skill hexagonal-module**: `.claude/skills/hexagonal-module/SKILL.md`
- **Documento principal**: `CLAUDE.md` (punto de entrada general del proyecto)

---

## 🎯 Para Agentes IA

**Al trabajar en este proyecto**:

1. **Lee PRIMERO**: `ARQUITECTURA_HEXAGONAL.md` - Reglas fundamentales
2. **Consulta CUANDO**: Necesites visualizar flujos → `ARQUITECTURA_DIAGRAMA.md`
3. **Consulta CUANDO**: Trabajes con controllers → `DECORADORES_PERSONALIZADOS.md`
4. **Referencia SIEMPRE**: Módulo INVENTARIO como ejemplo completo
5. **Verifica SIEMPRE**: Reglas de dependencia (domain → NADA)

**Cada módulo es autocontenido**. No necesitas leer múltiples módulos para entender uno solo.

---

**Este documento es el índice de toda la documentación de arquitectura. Para detalles completos, consulta los documentos específicos listados arriba.**
