# Proyecto Backend - Tienda Retail v2.1

**Versión del Dominio**: 2.1  
**Fecha**: Enero 2026  
**Arquitectura**: Domain-Driven Design (DDD) + Hexagonal Architecture (Ports & Adapters)  
**Total de Entidades**: 32 (26 de v1 + 6 nuevas en v2.1)

---

## Visión General del Sistema

Este es un backend para una **tienda retail de productos de vestir** que soporta operaciones físicas y digitales. El sistema implementa Domain-Driven Design con bounded contexts claramente delimitados.

### Características Principales

**Funcionalidades Core (v1.0):**

- Ventas multicanal (física y digital)
- Gestión de inventario con reservas temporales
- Sistema de cambios controlados con diferencia de precio
- Envíos externos con tracking
- Documentación fiscal (facturas, notas de crédito/débito)
- Gestión de terceros con roles múltiples

**Nuevas Funcionalidades (v2.1):**

- **Carrito**: Estado pre-transaccional sin reserva de inventario
- **Lista de Deseos**: Múltiples listas personalizadas por cliente
- **Notificaciones**: Sistema transversal in-app con preferencias configurables
- **Cliente con Cuenta**: Diferenciación entre clientes CON_CUENTA y SIN_CUENTA

---

## Principios Arquitectónicos

### 1. Fidelidad al Dominio

Ninguna simplificación técnica puede comprometer las reglas de negocio definidas en el dominio.

### 2. Separación Modelo Dominio / Modelo Persistencia

Los modelos de dominio y persistencia pueden evolucionar independientemente.

### 3. Consistencia sobre Rendimiento

Priorizamos integridad de datos en operaciones críticas (ventas, cambios, reservas).

### 4. Auditabilidad Nativa

Todo cambio de estado debe ser rastreable a través de EventoDominio y tablas de auditoría.

### 5. Desacoplamiento de Comunicaciones

El sistema de notificaciones es transversal y no conoce la lógica de negocio específica.

---

## Bounded Contexts y Módulos

El sistema está organizado en **11 contextos delimitados**, cada uno con responsabilidades claras:

| Contexto          | Responsabilidad                                                 | Archivo de Módulo            |
| ----------------- | --------------------------------------------------------------- | ---------------------------- |
| **IDENTIDAD**     | Gestión de terceros (personas/empresas) y sus roles             | `src/modules/identidad/`     |
| **CATALOGO**      | Definición de productos vendibles (productos y paquetes)        | `src/modules/catalogo/`      |
| **INVENTARIO**    | Control de existencias, reservas y movimientos                  | `src/modules/inventario/`    |
| **PRE_VENTA**     | Fase pre-transaccional: Carrito, Listas de Deseos, Preferencias | `src/modules/pre-venta/`     |
| **COMERCIAL**     | Transacciones de venta y cambios                                | `src/modules/comercial/`     |
| **LOGISTICA**     | Envíos y entregas externas                                      | `src/modules/logistica/`     |
| **FISCAL**        | Documentación legal y cumplimiento tributario                   | `src/modules/fiscal/`        |
| **COMUNICACION**  | Notificaciones a clientes y empleados                           | `src/modules/comunicacion/`  |
| **CONFIGURACION** | Parámetros operativos y políticas del negocio                   | `src/modules/configuracion/` |
| **SEGURIDAD**     | Perfiles, permisos y control de acceso                          | `src/modules/seguridad/`     |
| **AUDITORIA**     | Registro de eventos de dominio                                  | `src/modules/auditoria/`     |

---

## Relaciones de Alto Nivel entre Módulos

### Flujo Principal de Venta

```
PRE_VENTA (Carrito)
    ↓
COMERCIAL (Venta)
    ↓
INVENTARIO (Reserva)
    ↓
FISCAL (DocumentoFiscal)
    ↓
LOGISTICA (Envio) [si aplica]
    ↓
COMUNICACION (Notificaciones)
```

### Flujo de Cambio

```
COMERCIAL (Cambio solicitado)
    ↓
INVENTARIO (Reserva item nuevo)
    ↓
COMERCIAL (Ejecución cambio)
    ↓
FISCAL (NotaAjuste)
    ↓
COMUNICACION (Notificación)
```

### Flujo de Notificaciones

```
[CUALQUIER MÓDULO] → Evento de Dominio
    ↓
AUDITORIA (EventoDominio persistido)
    ↓
COMUNICACION (Notificacion creada)
    ↓
Preferencias verificadas (si no es transaccional)
    ↓
Envío asíncrono
```

---

## Convenciones y Estándares del Proyecto

### Arquitectura Hexagonal

Este proyecto sigue **Arquitectura Hexagonal (Ports & Adapters)** combinada con **Domain-Driven Design (DDD)**.

**📖 LEER**: `docs/arquitectura/CLAUDE_ARQUITECTURA.md` - **Índice completo de arquitectura**

Este índice te guiará a la documentación específica según tu necesidad:

- Estructura de módulos (domain, application, infrastructure)
- Reglas de dependencia hexagonal
- Puertos y adaptadores
- Agregados DDD
- Convenciones de nombres
- Inyección de dependencias con NestJS
- Patrones de testing
- Decoradores personalizados
- Ejemplos visuales y flujos completos

**Documentación por Módulo**:

1. **`{MODULO}_CLAUDE.md`**: Lógica de negocio, casos de uso, reglas, validaciones, flujos
2. **`{MODULO}_ENTITIES_CLAUDE.md`**: Entidades de base de datos con sus campos y relaciones

**IMPORTANTE**: Cada archivo es AUTOCONTENIDO. Un agente que lea solo ese archivo debe poder implementar el módulo completo sin ambigüedades.

### Nomenclatura de Entidades de Base de Datos

- **Tablas**: snake_case (ej: `linea_venta`, `movimiento_inventario`)
- **Campos**: snake_case (ej: `numero_documento`, `fecha_creacion`)
- **Enums**: UPPER_SNAKE_CASE (ej: `ACTIVO`, `CON_CUENTA`)
- **IDs**: Siempre UUID v7 (ver [Guía UUID v7](docs/patrones/UUID_V7_GUIDE.md))

### Generación de IDs (UUID v7)

Este proyecto utiliza **UUID v7** (RFC 9562) en lugar de UUID v4 para todos los identificadores.

**Razón**: UUID v7 está ordenado temporalmente, mejorando rendimiento de escritura un 28% vs UUID v4.

**Crear agregados**: Usar Factories que generan UUID v7 automáticamente

```typescript
import { InventarioFactory } from '@inventario/domain/factories';

const inventario = InventarioFactory.crear({
  tipoItem: 'PRODUCTO',
  itemId: productoId,
});
// El ID se genera automáticamente como UUID v7
```

**📖 Documentación completa**: `docs/patrones/UUID_V7_GUIDE.md`

### Estados y Enums

Todos los estados están definidos como enums en PostgreSQL. Ver archivo de entidades de cada módulo para la lista completa.

### Campos Comunes

Casi todas las entidades tienen:

- `id` (uuid, pk)
- `fecha_creacion` (timestamp, not null, default: now())
- Para entidades modificables: `fecha_modificacion` (timestamp, not null)

### Reglas de Eliminación

**NUNCA eliminamos registros físicamente**. Usamos:

- Estados (ej: `ACTIVO` → `INACTIVO`)
- Campos de fecha (ej: `fecha_egreso` en empleado)

**Excepciones** (entidades inmutables que SÍ son INSERT-only):

- `EventoDominio`
- `MovimientoInventario`
- `DocumentoFiscal`
- `NotaAjuste`

---

## Agregados Principales

### Agregado: Inventario

**Root**: Inventario  
**Entidades**: Reserva, MovimientoInventario

Controla existencias y garantiza que no se venda lo que no existe.

### Agregado: Venta

**Root**: Venta  
**Entidades**: LineaVenta, Cambio

Representa una transacción comercial desde confirmación hasta entrega.

### Agregado: Carrito (NUEVO v2.1)

**Root**: Carrito  
**Entidades**: ItemCarrito

Estado pre-transaccional que NO reserva inventario. Los precios son referenciales.

### Agregado: ListaDeseos (NUEVO v2.1)

**Root**: ListaDeseos  
**Entidades**: ItemListaDeseos

Colecciones personalizadas de productos de interés futuro.

### Agregado: Notificacion (NUEVO v2.1)

**Root**: Notificacion  
**Entidades**: Ninguna (atómica)

Comunicación unidireccional vinculada a eventos de dominio.

Ver cada archivo de módulo para detalles completos de invariantes y operaciones.

---

## Decisiones Arquitectónicas Clave

### 1. El Carrito NO Reserva Inventario

**Decisión congelada del dominio v2.1**

- La disponibilidad se verifica en tiempo real al visualizar el carrito
- La reserva se hace SOLO al iniciar el pago (conversión Carrito → Venta)
- Si un ítem no está disponible al pagar, se excluye y se notifica al cliente

**Razón**: Evitar bloqueo de inventario por carritos abandonados.

### 2. Un Carrito ACTIVO por Cliente CON_CUENTA

- Clientes con cuenta pueden tener UN carrito digital persistente
- Carritos físicos no tienen esta restricción (son sesionales)

### 3. Notificaciones Solo In-App Inicialmente

- Email, SMS, Push quedan para fase 2
- Esto simplifica implementación inicial sin comprometer extensibilidad

### 4. Precio Referencial vs Precio Contractual

- `ItemCarrito.precio_referencial`: Snapshot informativo, puede cambiar
- El precio definitivo se fija al convertir Carrito → Venta (momento contractual)

### 5. Reservas con Expiración de 20 Minutos

- Para ventas digitales: 20 minutos desde inicio de pago
- Para cambios: 20 minutos desde aprobación
- Después expiran automáticamente y liberan inventario

---

## Integraciones entre Módulos

### IDENTIDAD provee a

- COMERCIAL: Cliente (aunque Cliente está en COMERCIAL, tercero base está aquí)
- INVENTARIO: Empleado (para movimientos manuales)
- FISCAL: Tercero (info fiscal para documentos)
- SEGURIDAD: Empleado (para autenticación)

### CATALOGO provee a

- INVENTARIO: Producto/Paquete (para saber qué inventariar)
- COMERCIAL: Producto/Paquete (para líneas de venta)
- PRE_VENTA: Producto/Paquete (para carrito y listas)

### INVENTARIO consume de

- COMERCIAL: Eventos de Venta y Cambio (para reservar/descontar)
- CATALOGO: Producto/Paquete (para validar existencia)

### COMERCIAL consume de

- CATALOGO: Precios vigentes
- INVENTARIO: Disponibilidad y reservas
- PRE_VENTA: Carrito (para conversión)

### FISCAL consume de

- COMERCIAL: Venta, Cambio (para generar documentos)
- IDENTIDAD: Cliente (info tributaria)

### COMUNICACION consume de

- AUDITORIA: EventoDominio (origen de todas las notificaciones)
- PRE_VENTA: PreferenciaNotificacion (filtrado opcional)

### AUDITORIA es consumida por

- TODOS los módulos (todos emiten eventos de dominio)

---

## Casos de Uso Principales (Cross-Module)

### Caso 1: Cliente con Cuenta Compra Online

1. **PRE_VENTA**: Cliente agrega productos a carrito digital
2. **PRE_VENTA**: Cliente inicia pago
3. **COMERCIAL**: Sistema verifica disponibilidad consultando INVENTARIO
4. **COMERCIAL**: Si hay ítems no disponibles → COMUNICACION notifica exclusiones
5. **INVENTARIO**: Se reservan ítems disponibles (20 min)
6. **COMERCIAL**: Se crea Venta en estado BORRADOR
7. **COMERCIAL**: Cliente confirma pago → Venta pasa a CONFIRMADA
8. **FISCAL**: Se genera DocumentoFiscal
9. **LOGISTICA**: Se crea Envio (si modalidad es ENTREGA_EXTERNA)
10. **COMUNICACION**: Notificación de confirmación
11. **INVENTARIO**: Reserva se consolida en venta exitosa

### Caso 2: Cliente Solicita Cambio

1. **COMERCIAL**: Cliente solicita cambio de producto X por Y
2. **CATALOGO**: Validar que Y es elegible para cambio
3. **INVENTARIO**: Verificar disponibilidad de Y
4. **INVENTARIO**: Reservar Y (si disponible)
5. **COMERCIAL**: Cambio en estado SOLICITADO
6. **COMERCIAL**: Cliente devuelve X → estado RECIBIDO
7. **COMERCIAL**: Empleado valida → estado APROBADO
8. **COMERCIAL**: Sistema ejecuta cambio → estado EJECUTADO
9. **INVENTARIO**: X vuelve a stock, Y sale, reserva se consolida
10. **FISCAL**: Se genera NotaAjuste (crédito o débito según diferencia)
11. **COMUNICACION**: Notificación de cambio completado

### Caso 3: Producto de Lista de Deseos Disponible Nuevamente

1. **INVENTARIO**: Stock de producto P pasa de 0 a >0
2. **AUDITORIA**: Evento `ProductoDeListaDeseosDisponibleNuevamente`
3. **COMUNICACION**: Busca clientes con P en listas de deseos
4. **COMUNICACION**: Verifica preferencias (categoría LISTA_DESEOS)
5. **COMUNICACION**: Crea notificaciones para clientes con preferencia habilitada
6. **COMUNICACION**: Envía notificaciones in-app

---

## Parámetros Operativos Clave

Definidos en `CONFIGURACION`:

| Parámetro                          | Default (segundos) | Descripción                                         |
| ---------------------------------- | ------------------ | --------------------------------------------------- |
| `DURACION_RESERVA_VENTA`           | 1200 (20 min)      | Tiempo para completar pago antes de expirar reserva |
| `DURACION_RESERVA_CAMBIO`          | 1200 (20 min)      | Tiempo para ejecutar cambio                         |
| `UMBRAL_STOCK_BAJO`                | 10 unidades        | Trigger de notificación para empleados              |
| `MAX_REINTENTOS_NOTIFICACION`      | 3                  | Intentos de envío antes de marcar fallida           |
| `INTERVALO_REINTENTO_NOTIFICACION` | 300 (5 min)        | Tiempo entre reintentos                             |
| `HORAS_EXPIRACION_CARRITO_FISICO`  | 14400 (4 horas)    | Cuándo marcar carrito físico como abandonado        |

---

## Stack Tecnológico Definido

### Base de Datos y ORM

- **Base de Datos**: PostgreSQL 16+
- **ORM**: Prisma 5+

### Caché y Autenticación

- **Cache y Sesiones**: Redis 7+
- **Autenticación**: JWT (JSON Web Tokens) con Refresh Tokens almacenados en Redis

### Convenciones Técnicas

#### Prisma

- **Modelo de dominio vs. Modelo de Prisma**:
  - Modelos Prisma en `prisma/schema.prisma`
  - Mapeo explícito con `@@map` para nombres snake_case en BD
  - DTOs de dominio separados de modelos Prisma
- **Migraciones**:
  - Siempre usar `prisma migrate dev` en desarrollo
  - Revisar SQL generado antes de aplicar
  - Nombrar migraciones descriptivamente
- **Transacciones**:
  - Usar `$transaction` para operaciones multi-tabla críticas
  - Implementar retry logic para deadlocks

#### JWT y Autenticación

- **Access Token Payload**:

  ```typescript
  {
    sub: string;        // empleado_id o cliente_id
    tipo: 'EMPLEADO' | 'CLIENTE';
    perfil_id?: string; // solo para empleados
    exp: number;
    iat: number;
  }
  ```

- **Refresh Token**:
  - Almacenar en Redis con key: `refresh_token:{user_id}:{token_id}`
  - TTL configurable (default: 7 días)
  - Rotación automática en cada refresh
  - Invalidación manual en logout/cambio de contraseña

#### Redis

- **Convención de Keys**:
  - Sesiones: `session:{user_id}`
  - Cache: `cache:{module}:{entity}:{id}`
  - Locks: `lock:{operation}:{resource_id}`
  - Refresh tokens: `refresh_token:{user_id}:{token_id}`
- **TTL por Tipo**:
  - Sesiones: 30 minutos (renovable)
  - Cache catálogo: 1 hora
  - Cache configuración: 15 minutos
  - Reservas: 20 minutos (según dominio)
  - Refresh tokens: 7-30 días (configurable)

### Requisitos del ORM (Prisma)

El ORM debe soportar:

- ✅ Transacciones ACID
- ✅ Optimistic locking (control de concurrencia por versión) - usar `@@version` o timestamps
- ✅ Migraciones versionadas
- ✅ Type-safety en queries
- ✅ Relaciones complejas (1:N, N:M con tablas intermedias)
- ✅ Enums nativos de PostgreSQL
- ✅ Middleware para auditoría automática

---

## Skills y Patrones de Código

Este proyecto utiliza **skills** para garantizar consistencia en patrones de código y mejores prácticas. Las skills son guías autocontenidas que se activan automáticamente según el contexto de trabajo.

### Skills Disponibles

Todas las skills están en `.claude/skills/` y se cargan automáticamente cuando trabajas en contextos específicos:

| Skill                    | Contexto de Activación                                                      | Ubicación                                        |
| ------------------------ | --------------------------------------------------------------------------- | ------------------------------------------------ |
| **hexagonal-module**     | Al crear módulos, agregar archivos, validar capas, puertos, adaptadores, DI | `.claude/skills/hexagonal-module/`               |
| **typescript**           | Al escribir código TypeScript (tipos, interfaces, genéricos)                | `.claude/skills/typescript/`                     |
| **zod-4**                | Al trabajar con validaciones Zod (DTOs, schemas)                            | `.claude/skills/zod-4/`                          |
| **code-comments-policy** | Al escribir, editar o generar código (cualquier lenguaje)                   | Global: `~/.claude/skills/code-comments-policy/` |

### Cuándo se Activan las Skills

#### Hexagonal Module Skill

**Se activa cuando**:

- Creás un módulo nuevo o agregás archivos a uno existente
- Necesitás saber en qué capa/carpeta va un archivo
- Trabajás con puertos (inbound/outbound), adaptadores o repositorios
- Configurás inyección de dependencias con tokens Symbol
- Implementás agregados, factories, eventos de dominio o excepciones
- Creás mappers entre capas (Domain <-> Prisma, Domain <-> DTO)

**Patrones clave**:

- ✅ Estructura exacta de archivos por módulo hexagonal
- ✅ Tabla de decisión: "dónde va este archivo" por capa
- ✅ Reglas de dependencia estrictas (domain → nada, app → domain, infra → domain+app)
- ✅ Un agregado = un repository (DDD)
- ✅ Tres modelos separados (Domain, Prisma, DTO)
- ✅ Convenciones de nombres (sin prefijo "I", sufijos técnicos en adaptadores)
- ✅ DI tokens como Symbols

#### TypeScript Skill

**Se activa cuando**:

- Defines tipos, interfaces o enums
- Trabajas con genéricos
- Escribes archivos `.ts` en cualquier módulo
- Defines Types del dominio (`domain/aggregates/{entidad}/{entidad}.types.ts`)

**Patrones clave**:

- ✅ `enum` como primera opción para valores fijos del dominio (estados, roles, categorías)
- ✅ Const Types Pattern solo como fallback (tipos derivados, lookup tables, template literals)
- ✅ Interfaces planas (un nivel de profundidad)
- ✅ NUNCA usar `any`, usar `unknown` + type guards
- ✅ Utility types (Pick, Omit, Partial, etc.)

**Ejemplo**:

```typescript
// ✅ PREFERIDO: enum para valores de dominio
export enum TipoOperacion {
  VENTA = 'VENTA',
  CAMBIO = 'CAMBIO',
  AJUSTE = 'AJUSTE',
}

// ✅ FALLBACK: Const Types Pattern cuando enum no puede expresarlo
const ERROR_CODES = {
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
} as const;
type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// ❌ NUNCA: Union types directos
type TipoOperacion = 'VENTA' | 'CAMBIO' | 'AJUSTE';
```

#### Zod-4 Skill

**Se activa cuando**:

- Defines DTOs de aplicación (`application/dto/*.dto.ts`)
- Creas schemas de validación
- Trabajas con validaciones HTTP/API

**Patrones clave**:

- ✅ Usa validadores top-level de Zod 4 (`z.email()`, `z.uuid()`, `z.url()`)
- ✅ NUNCA usar Zod 3 patterns (`z.string().email()`)
- ✅ Custom error messages con `{ error: "mensaje" }`
- ✅ `safeParse()` para validaciones no-críticas

**Ejemplo**:

```typescript
// ✅ CORRECTO: Zod 4
const reservarInventarioSchema = z.object({
  itemId: z.uuid({ error: 'ID de item inválido' }),
  cantidad: z.number().int().positive(),
  tipoOperacion: z.enum(['VENTA', 'CAMBIO', 'AJUSTE']),
});

// ❌ INCORRECTO: Zod 3
const schema = z.object({
  itemId: z.string().uuid(), // ❌ Obsoleto en Zod 4
});
```

#### Code-Comments-Policy Skill (Global)

**Se activa cuando**:

- Escribís, editás o generás código en CUALQUIER lenguaje
- Agregás comentarios JSDoc
- Revisás o limpiás documentación existente

**Patrones clave**:

- ✅ Comentar el WHY, NUNCA el WHAT
- ✅ Documentar side effects y comportamientos no obvios
- ✅ Usar JSDoc en TypeScript (`/** */`)
- ❌ NUNCA comentar nombres de propiedades obvias
- ❌ NUNCA comentar "qué hace" el código (eso se lee)

**Ejemplo**:

```typescript
// ✅ CORRECTO: Explica WHY y side effects
/**
 * Usa UUID v7 en lugar de v4 porque está ordenado temporalmente.
 * Esto reduce fragmentación en índices PostgreSQL un 28%.
 *
 * @throws {InvalidFormatError} Si el string no es un UUID válido
 */
class UUID extends ValueObject<string> {}

// ❌ INCORRECTO: Explica lo obvio
/**
 * Clase UUID
 */
class UUID {}

/** El ID del usuario */
userId: string; // ❌ Obvio, no aporta valor
```

**Ubicación**: `~/.claude/skills/code-comments-policy/SKILL.md` (global, aplica a todos los proyectos)

### Cómo Usar las Skills

**Las skills se cargan automáticamente** cuando detectan su contexto. No necesitas hacer nada manualmente.

**Para consultar una skill manualmente**:

```bash
# Ver skill de TypeScript
cat .claude/skills/typescript/SKILL.md

# Ver skill de Zod 4
cat .claude/skills/zod-4/SKILL.md

# Ver skill de comentarios (global)
cat ~/.claude/skills/code-comments-policy/SKILL.md
```

### Agregar Nuevas Skills

Si necesitas agregar una skill específica para este proyecto (ej: patrones de NestJS, Prisma, testing):

1. Crea directorio en `.claude/skills/{nombre-skill}/`
2. Crea archivo `SKILL.md` con:
   - Metadata (name, description, trigger)
   - Patrones clave (✅ correcto vs ❌ incorrecto)
   - Ejemplos específicos del proyecto
3. Actualiza esta sección del CLAUDE.md

**Ejemplo de estructura**:

```
.claude/skills/
├── typescript/
│   └── SKILL.md
├── zod-4/
│   └── SKILL.md
├── nestjs-expert/
│   └── SKILL.md
└── nestjs-ddd/          ← Nueva skill
    └── SKILL.md
```

---

## Próximos Pasos para Implementación

### 1. **Entender la Arquitectura Hexagonal**

**LEER PRIMERO**: `docs/arquitectura/CLAUDE_ARQUITECTURA.md` - Índice y guía rápida de arquitectura

Este documento te guía a la documentación específica según tu necesidad:

- **ARQUITECTURA_HEXAGONAL.md**: Guía completa con estructura de módulos, puertos, adaptadores, agregados DDD, inyección de dependencias, testing y patrones de código
- **ARQUITECTURA_DIAGRAMA.md**: Visualizaciones ASCII de flujos de datos, dependencias entre módulos, hexágono completo
- **DECORADORES_PERSONALIZADOS.md**: Guía de decoradores NestJS personalizados (`@ValidateWith`, `@RequireRole`, etc.)

**Convenciones de nombres** para puertos y adaptadores:

- Sin prefijo "I" en interfaces
- Sufijos técnicos en implementaciones (ej: `VentaPostgresRepository`, `InventarioHttpAdapter`)
- Patrones y ejemplos completos en la documentación

### 2. **Explorar el Módulo de Ejemplo**

El módulo `INVENTARIO` está completamente implementado como referencia:

- `src/modules/inventario/domain/` - Agregados, puertos, eventos
- `src/modules/inventario/application/` - Servicios, DTOs, schemas Zod
- `src/modules/inventario/infrastructure/` - Adaptadores, controllers, repositorios
- `src/modules/inventario/docs/` - Decoradores Swagger, ejemplos HTTP
- `src/modules/inventario/INVENTARIO_CLAUDE.md` - Documentación del dominio

### 3. **Implementar Módulos Fundamentales**

Orden recomendado (de menos a más dependencias):

1. **IDENTIDAD** - Base para terceros (personas/empresas)
2. **CATALOGO** - Productos y paquetes
3. **INVENTARIO** - Stock y reservas
4. **PRE_VENTA** - Carrito y listas
5. **COMERCIAL** - Ya implementado (referencia)
6. **FISCAL** - Documentos tributarios
7. **LOGISTICA** - Envíos
8. **COMUNICACION** - Notificaciones
9. **AUDITORIA** - Eventos de dominio
10. **SEGURIDAD** - Perfiles y permisos
11. **CONFIGURACION** - Parámetros

Para cada módulo:

```bash
# 1. Leer documentación de dominio
cat src/modules/{modulo}/{MODULO}_CLAUDE.md

# 2. Leer entidades de BD
cat src/modules/{modulo}/{MODULO}_ENTITIES_CLAUDE.md

# 3. La estructura hexagonal ya está creada
ls src/modules/{modulo}/
```

### 4. **Configurar Prisma**

```bash
# 1. Instalar Prisma
npm install prisma @prisma/client

# 2. Inicializar esquema
npx prisma init

# 3. Generar modelos desde archivos ENTITIES_CLAUDE.md

# 4. Crear migración
npx prisma migrate dev --name init

# 5. Generar cliente
npx prisma generate
```

### 5. **Implementar Jobs Background**

- Expiración de reservas (20 minutos)
- Reintentos de notificaciones
- Limpieza de carritos físicos abandonados
- Usar @nestjs/schedule o Bull/BullMQ

### 6. **Configurar Event Bus**

- Redis para eventos in-memory
- RabbitMQ para eventos persistentes (opcional)
- Implementar adaptadores en `infrastructure/adapters/event-bus.adapter.ts`

### 7. **Documentar Endpoints con Swagger**

Cada módulo debe documentar sus endpoints HTTP siguiendo el patrón establecido:

```bash
# Ver guía completa
cat docs/patrones/SWAGGER_INTEGRATION_GUIDE.md

# Revisar implementación de referencia (INVENTARIO)
cat src/modules/inventario/docs/decorators/api-inventario.decorator.ts
```

**Patrón de documentación**:

- Ejemplos en `/docs/examples`
- Decoradores de error en `/docs/decorators/api-error-responses.decorator.ts`
- Decoradores de endpoint en `/docs/decorators/api-{modulo}.decorator.ts`
- Aplicar decoradores en controllers

**Acceso a Swagger UI** (solo desarrollo):

```
http://localhost:3000/api/docs
```

---

## Referencias Internas

### Arquitectura

- **Índice de Arquitectura**: `docs/arquitectura/CLAUDE_ARQUITECTURA.md` (⭐ punto de entrada)
- **Arquitectura Hexagonal Completa**: `docs/arquitectura/ARQUITECTURA_HEXAGONAL.md`
- **Diagramas Visuales**: `docs/arquitectura/ARQUITECTURA_DIAGRAMA.md`
- **Decoradores Personalizados**: `docs/arquitectura/DECORADORES_PERSONALIZADOS.md`

### Persistencia y Patrones

- **Diseño de Persistencia Completo**: `docs/persistencia/diseno_persistencia_backend_v2.md`
- **Diagrama de Base de Datos**: `tienda_retail_dbdiagram_v2.md`
- **Guía UUID v7**: `docs/patrones/UUID_V7_GUIDE.md`
- **Guía de Integración Swagger**: `docs/patrones/SWAGGER_INTEGRATION_GUIDE.md`

---

## Notas Finales para Agentes IA

Cuando trabajes en un módulo específico:

1. **Lee el archivo `{MODULO}_CLAUDE.md` correspondiente** - Tiene toda la lógica de negocio
2. **Lee el archivo `{MODULO}_ENTITIES_CLAUDE.md`** - Tiene todas las entidades
3. **Si necesitas entidades de otro módulo**, busca referencias explícitas en la sección "Integraciones"
4. **NO dupliques lógica de negocio de otros módulos**, solo referéncialos
5. **Sigue las convenciones de este archivo** para nomenclatura y estándares

**Cada módulo es AUTOCONTENIDO** - no deberías necesitar leer múltiples archivos para entender uno solo.

---

**Este es el punto de entrada arquitectónico del proyecto. Lee este archivo primero, luego profundiza en el módulo específico que necesites.**
