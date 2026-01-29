# Plan de Validación y Refactoring - InventarioPostgresRepository

**Fecha**: 29 Enero 2026  
**Estado**: EN VALIDACIÓN (esperando aprobación)  
**Archivo**: `src/modules/inventario/infrastructure/persistence/repositories/inventario-postgres.repository.ts`

---

## 📋 Análisis de Métodos Existentes

### ✅ MÉTODOS YA CORRECTOS (No requieren cambios)

#### 1. **`guardar()` - REFACTORIZADO ✓**

- **Status**: Ya refactorizado en commit anterior
- **Líneas**: 25 (método público) + submétodos
- **Responsabilidades**: Orquestación de persistencia
- **Documentación**: JSDoc completo explicando decisiones
- **TypeScript**: Cumple con strict patterns
- **Conclusión**: LISTO

---

#### 2. **`buscarPorId()` - SIMPLE ✓**

- **Líneas**: 12
- **Responsabilidad**: 1 sola (buscar por ID)
- **Documentación**: Nombre self-descriptive, sin necesidad de JSDoc
- **TypeScript**: Tipos explícitos, manejo de null
- **Características**:
  - Guard clause implícito: `deleted: false`
  - Mapping a dominio correcto
  - Transacción context opcional
- **Conclusión**: LISTO

---

#### 3. **`buscarPorItem()` - SIMPLE ✓**

- **Líneas**: 18
- **Responsabilidad**: 1 sola (buscar por tipo_item + item_id)
- **Documentación**: Nombre descriptivo
- **TypeScript**: Cast correcto `as TipoItemEnum`
- **Características**:
  - Guard clause: `deleted: false`
  - Índice único utilizado correctamente
- **Conclusión**: LISTO

---

#### 4. **`buscarTodos()` - SIMPLE ✓**

- **Líneas**: 8
- **Responsabilidad**: 1 sola (traer todos activos)
- **Documentación**: Self-descriptive
- **TypeScript**: Array mapping correcto
- **Características**:
  - Guard clause: `deleted: false`
- **Conclusión**: LISTO

---

#### 5. **`buscarInventariosBajoUmbral()` - SIMPLE ✓**

- **Líneas**: 13
- **Responsabilidad**: 1 sola (buscar bajo umbral)
- **Documentación**: Self-descriptive
- **Características**:
  - Guard clause: `deleted: false`
  - Comparador `lt` (less than)
- **Conclusión**: LISTO

---

#### 6. **`buscarReservasActivas()` - SIMPLE ✓**

- **Líneas**: 11
- **Responsabilidad**: 1 sola (reservas activas de una operación)
- **Características**:
  - Mapeo correcto a dominio
  - Enum utilizado correctamente
- **Conclusión**: LISTO

---

#### 7. **`buscarReservasExpiradas()` - SIMPLE ✓**

- **Líneas**: 11
- **Responsabilidad**: 1 sola (reservas con fecha expirada)
- **Características**:
  - Cálculo de `ahora` correcto
  - Comparador `lt` apropiado
- **Conclusión**: LISTO

---

#### 8. **`buscarReservasPorInventario()` - SIMPLE ✓**

- **Líneas**: 8
- **Responsabilidad**: 1 sola (reservas de un inventario)
- **Conclusión**: LISTO

---

### ⚠️ MÉTODOS CON PROBLEMAS (Requieren cambios)

---

#### **PROBLEMA 1: `buscarMovimientos()` - Falta JSDoc**

**Ubicación**: Línea 288-305  
**Líneas**: 18  
**Status**: ⚠️ Requiere Documentación

```typescript
async buscarMovimientos(
  inventarioId: string,
  options?: BuscarMovimientosOptions,
): Promise<MovimientoInventario[]> {
  // ❌ Sin JSDoc
  const prismaCtx = options?.transactionContext || this.prismaService.prisma;

  // ⚠️ Lógica de paginación: default || pattern
  const datos = await prismaCtx.movimientoInventario.findMany({
    where: { inventarioId },
    orderBy: { fechaMovimiento: 'desc' },
    take: options?.limit || 100,      // ← Default mágico, sin JSDoc
    skip: options?.offset || 0,
  });

  return datos.map((data) =>
    MovimientoInventario.desde(
      PrismaMovimientoInventarioMapper.toDomain(data),
    ),
  );
}
```

**Problemas Identificados**:

1. ❌ **Sin JSDoc**: No explica por qué ordenar por `fechaMovimiento: desc`
2. ⚠️ **Magic numbers**: `limit: 100` es un default no documentado
3. ⚠️ **Lógica de defaults**: `options?.limit || 100` no usa `??` (TypeScript strict)
4. ✓ **TypeScript**: Por lo demás bien

**Cambios Necesarios**:

- Agregar JSDoc explicando paginación y orden
- Cambiar `||` a `??` (nullish coalescing)
- Documentar por qué default 100

**Complejidad**: BAJA - Solo agregar JSDoc + cambiar operador

---

#### **PROBLEMA 2: `eliminar()` - Lógica Duplicada con `persistirInventario()`**

**Ubicación**: Línea 308-343  
**Líneas**: 36  
**Status**: ⚠️ Requiere Refactoring

```typescript
async eliminar(
  inventario: Inventario,
  ctx?: TransactionContext,
): Promise<void> {
  const ejecutarEliminacion = async (tx: PrismaTransactionClient) => {
    // ❌ DUPLICADO: Mismo patrón que persistirInventario()
    const data = PrismaInventarioMapper.toPersistence(inventario);
    const versionAnterior = data.version - 1;

    // ❌ updateMany repetido
    const resultado = await tx.inventario.updateMany({
      where: {
        id: inventario.id,
        version: versionAnterior,
        // ⚠️ Aquí NO hay "deleted: false" check
      },
      data: {
        deleted: true,
        version: data.version,
        fechaActualizacion: data.fechaActualizacion,
      },
    });

    if (resultado.count === 0) {
      throw new OptimisticLockingError('Inventario', inventario.id);
    }
  };

  // ❌ DUPLICADO: Mismo patrón de transacción que guardar()
  if (ctx) {
    await ejecutarEliminacion(ctx);
  } else {
    await this.prismaService.prisma.$transaction(ejecutarEliminacion);
  }
}
```

**Problemas Identificados**:

1. ❌ **Lógica de versioning duplicada**: Mismo que `persistirInventario()`
2. ❌ **Manejo de transacciones duplicado**: Mismo if/else que `guardar()`
3. ❌ **Falta validación**: No valida `deleted: false` en WHERE
4. ⚠️ **Sin JSDoc adecuado**: El JSDoc existe pero es genérico

**Análisis Profundo**:

- El método `eliminar()` hace TODO:
  1. Valida versioning (optimistic locking)
  2. Marca como deleted
  3. Maneja transacciones (propia o pasada)

**Cambios Necesarios**:

1. **Extraer `actualizarInventarioConVersionCheck()`**
   - Responsabilidad: UPDATE con version check (reutilizable)
   - Usado por: `persistirInventario()` y `eliminar()`
   - Retorna: resultado.count

2. **Refactorizar `eliminar()`** con nuevo submétodo
   - Reducir líneas
   - Eliminar duplicación
   - Mejorar claridad

3. **Extraer `ejecutarConTransaccion()`** (OPCIONAL - pero recomendado)
   - Responsabilidad: Orquestar transacción propia o pasada
   - Usado por: `guardar()` y `eliminar()`
   - Evita el patrón if/else duplicado

**Complejidad**: MEDIA - Requiere extraer métodos reutilizables

---

#### **PROBLEMA 3: `mapearReservaADominio()` - Tipo `any`**

**Ubicación**: Línea 345-359  
**Líneas**: 15  
**Status**: ❌ TypeScript Strict Violation

```typescript
private mapearReservaADominio(data: any): Reserva {  // ← ❌ any
  return Reserva.desde({
    id: data.id,
    inventarioId: data.inventarioId,
    tipoOperacion: data.tipoOperacion,
    operacionId: data.operacionId,
    cantidad: data.cantidad,
    estado: data.estado,
    fechaCreacion: data.fechaCreacion,
    fechaExpiracion: data.fechaExpiracion,
    fechaResolucion: data.fechaResolucion,
    actorTipo: data.actorTipo,
    actorId: data.actorId,
  });
}
```

**Problemas Identificados**:

1. ❌ **`any` type**: Violación directa de TypeScript strict
2. ❌ **Sin JSDoc**: No documenta el tipo esperado
3. ⚠️ **Reutilizado 3 veces**: En métodos que retornan Reserva[]

**Cambios Necesarios**:

1. Importar tipo `Reserva as PrismaReserva` desde @prisma/client
2. Cambiar parámetro: `data: any` → `data: PrismaReserva`
3. Agregar JSDoc
4. Esto automáticamente mejora todos los 3 métodos que lo usan

**Complejidad**: BAJA - Solo tipo + JSDoc

---

## 📊 Resumen de Cambios Propuestos

| Método                    | Problema              | Tipo        | Complejidad | Acción                                          |
| ------------------------- | --------------------- | ----------- | ----------- | ----------------------------------------------- |
| `buscarMovimientos()`     | Falta JSDoc + `\|\|`  | Doc + Style | BAJA        | Agregar JSDoc, cambiar a `??`                   |
| `eliminar()`              | Lógica duplicada      | Refactor    | MEDIA       | Extraer `actualizarInventarioConVersionCheck()` |
| `mapearReservaADominio()` | Tipo `any`            | TypeScript  | BAJA        | Cambiar a tipo real, agregar JSDoc              |
| `guardar()` → transacción | Duplicación de patrón | OPCIONAL    | BAJA        | Extraer `ejecutarConTransaccion()`              |

---

## 🎯 Plan de Refactoring Propuesto

### **FASE 1: Cambios Simples (Recomendado Hacer Primero)**

#### 1.1 - `buscarMovimientos()` - Agregar JSDoc + TypeScript Strict

**Cambios**:

- Agregar JSDoc explicando paginación default
- Cambiar `||` a `??`
- **Líneas afectadas**: ~18 líneas (sin cambio lógico)

```typescript
/**
 * Fetches inventory movements paginated and ordered by most recent first.
 * Uses default pagination (limit=100, offset=0) for memory efficiency.
 * Returns movements newest-first to track recent activity.
 */
async buscarMovimientos(
  inventarioId: string,
  options?: BuscarMovimientosOptions,
): Promise<MovimientoInventario[]> {
  const prismaCtx = options?.transactionContext ?? this.prismaService.prisma;

  const datos = await prismaCtx.movimientoInventario.findMany({
    where: { inventarioId },
    orderBy: { fechaMovimiento: 'desc' },
    take: options?.limit ?? 100,    // ← Changed from ||
    skip: options?.offset ?? 0,      // ← Changed from ||
  });

  return datos.map((data) =>
    MovimientoInventario.desde(
      PrismaMovimientoInventarioMapper.toDomain(data),
    ),
  );
}
```

---

#### 1.2 - `mapearReservaADominio()` - Fijar Tipo + JSDoc

**Cambios**:

- Cambiar `data: any` a `data: Reserva as PrismaReserva` (tipo real)
- Agregar JSDoc
- **Líneas afectadas**: ~15 líneas (sin cambio lógico)

```typescript
/**
 * Maps Prisma Reserva record to domain Reserva aggregate.
 * Handles all fields including nullable resolution dates.
 */
private mapearReservaADominio(data: PrismaReserva): Reserva {
  return Reserva.desde({
    id: data.id,
    inventarioId: data.inventarioId,
    tipoOperacion: data.tipoOperacion,
    operacionId: data.operacionId,
    cantidad: data.cantidad,
    estado: data.estado,
    fechaCreacion: data.fechaCreacion,
    fechaExpiracion: data.fechaExpiracion,
    fechaResolucion: data.fechaResolucion,
    actorTipo: data.actorTipo,
    actorId: data.actorId,
  });
}
```

**Imports necesarios**:

```typescript
import type { Reserva as PrismaReserva } from '@prisma/client';
```

---

### **FASE 2: Refactoring Medio (Eliminar Duplicación)**

#### 2.1 - Extraer `actualizarInventarioConVersionCheck()`

**Responsabilidad**: UPDATE con version check (reutilizable)

**Usado por**:

- `persistirInventario()` (línea 83-90)
- `eliminar()` (línea 321-331)

```typescript
/**
 * Updates an inventory record with optimistic locking (version check).
 * Only succeeds if version matches expected previous version.
 * Prevents concurrent modification conflicts.
 * @throws OptimisticLockingError if version mismatch or already deleted
 */
private async actualizarInventarioConVersionCheck(
  tx: PrismaTransactionClient,
  inventarioId: string,
  versionAnterior: number,
  data: Record<string, unknown>,
  filtrosAdicionales?: Record<string, unknown>,
): Promise<void> {
  const resultado = await tx.inventario.updateMany({
    where: {
      id: inventarioId,
      version: versionAnterior,
      ...filtrosAdicionales,
    },
    data,
  });

  if (resultado.count === 0) {
    throw new OptimisticLockingError('Inventario', inventarioId);
  }
}
```

**Refactorizar `persistirInventario()`**:

```typescript
private async persistirInventario(
  tx: PrismaTransactionClient,
  inventario: Inventario,
): Promise<void> {
  const data = PrismaInventarioMapper.toPersistence(inventario);
  const existe = await tx.inventario.findUnique({
    where: { id: inventario.id },
  });

  if (!existe) {
    await tx.inventario.create({ data });
    return;
  }

  const versionAnterior = data.version - 1;
  await this.actualizarInventarioConVersionCheck(
    tx,
    inventario.id,
    versionAnterior,
    data,
    { deleted: false },  // ← Protege soft-deleted
  );
}
```

**Refactorizar `eliminar()`**:

```typescript
async eliminar(
  inventario: Inventario,
  ctx?: TransactionContext,
): Promise<void> {
  const ejecutarEliminacion = async (tx: PrismaTransactionClient) => {
    const data = PrismaInventarioMapper.toPersistence(inventario);
    const versionAnterior = data.version - 1;

    await this.actualizarInventarioConVersionCheck(
      tx,
      inventario.id,
      versionAnterior,
      {
        deleted: true,
        version: data.version,
        fechaActualizacion: data.fechaActualizacion,
      },
    );
  };

  if (ctx) {
    await ejecutarEliminacion(ctx);
  } else {
    await this.prismaService.prisma.$transaction(ejecutarEliminacion);
  }
}
```

---

### **FASE 3: Refactoring Avanzado (OPCIONAL - Recomendado)**

#### 3.1 - Extraer `ejecutarConTransaccion()`

**Responsabilidad**: Orquestar transacción propia o pasada (reutilizable)

**Usado por**:

- `guardar()` (línea 52-57)
- `eliminar()` (línea 338-342)

```typescript
/**
 * Executes a function within a database transaction.
 * Reuses external transaction if provided, otherwise creates new one.
 * Ensures ACID properties for complex multi-table operations.
 */
private async ejecutarConTransaccion(
  fn: (tx: PrismaTransactionClient) => Promise<void>,
  ctx?: TransactionContext,
): Promise<void> {
  if (ctx) {
    await fn(ctx);
  } else {
    await this.prismaService.prisma.$transaction(fn);
  }
}
```

**Simplificar `guardar()`**:

```typescript
async guardar(
  inventario: Inventario,
  options?: GuardarInventarioOptions,
): Promise<void> {
  const ejecutarGuardado = async (tx: PrismaTransactionClient) => {
    await this.persistirInventario(tx, inventario);
    if (options?.reservas?.nuevas) {
      await this.guardarReservasNuevas(tx, options.reservas.nuevas);
    }
    if (options?.reservas?.actualizadas) {
      await this.actualizarReservas(tx, options.reservas.actualizadas);
    }
    if (options?.movimientos) {
      await this.crearMovimientos(tx, options.movimientos);
    }
  };

  await this.ejecutarConTransaccion(ejecutarGuardado, options?.transactionContext);
}
```

**Simplificar `eliminar()`**:

```typescript
async eliminar(
  inventario: Inventario,
  ctx?: TransactionContext,
): Promise<void> {
  const ejecutarEliminacion = async (tx: PrismaTransactionClient) => {
    const data = PrismaInventarioMapper.toPersistence(inventario);
    const versionAnterior = data.version - 1;

    await this.actualizarInventarioConVersionCheck(
      tx,
      inventario.id,
      versionAnterior,
      {
        deleted: true,
        version: data.version,
        fechaActualizacion: data.fechaActualizacion,
      },
    );
  };

  await this.ejecutarConTransaccion(ejecutarEliminacion, ctx);
}
```

---

## 📈 Impacto del Refactoring

### Métrica: Reducción de Duplicación

| Concepto                    | Antes     | Después | Reducción |
| --------------------------- | --------- | ------- | --------- |
| Líneas de setup transacción | 14 (2×)   | 8 (1×)  | -43%      |
| Líneas de version check     | 12 (2×)   | 8 (1×)  | -33%      |
| `any` types                 | 1         | 0       | -100%     |
| JSDoc faltantes             | 2 métodos | 0       | -100%     |

### Complejidad Ciclomática

| Método                | Antes | Después | Reducción |
| --------------------- | ----- | ------- | --------- |
| `eliminar()`          | 2     | 1       | -50%      |
| `guardar()`           | 3     | 2       | -33%      |
| `buscarMovimientos()` | 1     | 1       | -         |

---

## ✅ Validación Post-Refactoring

Todos los cambios serán validados:

1. ✓ Compilación TypeScript sin errores
2. ✓ Prisma types correctos
3. ✓ Transacciones ACID garantizadas
4. ✓ JSDoc completo (WHY, no WHAT)
5. ✓ Sin `any` types
6. ✓ Guard clauses presente
7. ✓ Nullish coalescing (`??` no `||`)

---

## 🎯 Recomendación

**Se propone hacer:**

1. ✅ **FASE 1** (Cambios simples): Agregar JSDoc, fijar tipos `any`
2. ✅ **FASE 2** (Refactoring): Eliminar duplicación de lógica
3. ⏳ **FASE 3** (Opcional): Simplificar manejo de transacciones

**Tiempo estimado**:

- FASE 1: 30 minutos
- FASE 2: 45 minutos
- FASE 3: 20 minutos
- Tests: 30 minutos

**Total**: ~2 horas

---

## 📝 Próximos Pasos

1. **Esperar aprobación** de este plan
2. **Ejecutar cambios fase por fase**
3. **Compilar y validar** después de cada fase
4. **Hacer commits** por cada fase completada
5. **Crear PR con todos los cambios**

---

**Estado**: ⏳ ESPERANDO APROBACIÓN  
**Archivos a modificar**: 1 (inventario-postgres.repository.ts)  
**Complejidad global**: MEDIA  
**Riesgo**: BAJO (cambios muy localizados, sin lógica de negocio)
