# Guía de Integración de Swagger en Módulos

## Visión General

Esta guía explica cómo documentar endpoints con Swagger en nuevos módulos siguiendo el patrón establecido en **INVENTARIO**.

**Principio**: Swagger documenta la **capa HTTP** (controllers). El dominio ya está documentado en archivos `{MODULO}_CLAUDE.md`.

### Estructura de Respuestas HTTP

**TODAS** las respuestas de la API usan la estructura `ApiResponse<T>`:

```typescript
interface ApiResponse<T> {
  ok: boolean; // true = éxito, false = error
  status: number; // Código HTTP
  data: T | null; // Datos en éxito, null en error
  errors: ErrorDetail[]; // [] en éxito, lista de errores en error
}

interface ErrorDetail {
  code: string; // Código del error (ej: "STOCK_INSUFICIENTE")
  message: string; // Mensaje descriptivo
}
```

**Respuesta exitosa** (manejada por `ApiResponseInterceptor`):

```json
{
  "ok": true,
  "status": 200,
  "data": { "id": "...", "nombre": "..." },
  "errors": []
}
```

**Respuesta de error** (manejada por `HttpExceptionFilter`):

```json
{
  "ok": false,
  "status": 422,
  "data": null,
  "errors": [
    {
      "code": "STOCK_INSUFICIENTE",
      "message": "No hay suficiente stock disponible"
    }
  ]
}
```

**Errores de validación** (múltiples errores):

```json
{
  "ok": false,
  "status": 400,
  "data": null,
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "message": "tipoItem: Debe ser PRODUCTO o PAQUETE"
    },
    {
      "code": "VALIDATION_ERROR",
      "message": "cantidad: Debe ser positivo"
    }
  ]
}
```

---

## Estructura Requerida

Cada módulo debe tener esta estructura en `/docs`:

```
src/modules/{MODULO}/
└── docs/
    ├── decorators/
    │   ├── api-{modulo}.decorator.ts         # Decoradores de endpoints
    │   └── api-error-responses.decorator.ts  # Errores específicos del módulo
    ├── examples/
    │   └── {modulo}.examples.ts              # Ejemplos de request/response
    └── swagger.config.ts                     # Metadata del módulo (opcional)
```

---

## Paso a Paso

### 1. Crear Ejemplos

Define ejemplos realistas basados en tus DTOs usando **UUIDs v7** válidos.

**IMPORTANTE**: Los ejemplos son solo el contenido de `data`, NO la estructura completa de `ApiResponse`.

```typescript
// src/modules/comercial/docs/examples/venta.examples.ts
export const CREAR_VENTA_REQUEST_EXAMPLE = {
  clienteId: '01933e7f-1234-7890-abcd-ef1234567890',
  lineas: [
    {
      productoId: '01933e7f-5678-1234-abcd-ef1234567890',
      cantidad: 2,
      precioUnitario: 29.99,
    },
  ],
  modalidadEntrega: 'ENTREGA_EXTERNA',
} as const;

// Solo el contenido de 'data', no incluir ApiResponse wrapper
export const VENTA_RESPONSE_EXAMPLE = {
  id: '01933e7f-abcd-ef12-3456-7890abcdef12',
  estado: 'CONFIRMADA',
  total: 59.98,
  fechaCreacion: '2026-01-30T05:30:00.000Z',
} as const;
```

**Reglas**:

- Usar `as const` para inferencia estricta de tipos
- UUIDs v7 válidos (prefijo `01933e7f-...`)
- Ejemplos completos y realistas
- Solo el contenido de `data` (el wrapper se agrega en el decorador)

### 2. Crear Decoradores de Error

Reutiliza decoradores compartidos de `@shared/docs` y agrega errores específicos del módulo.

```typescript
// src/modules/comercial/docs/decorators/api-error-responses.decorator.ts
import { applyDecorators } from '@nestjs/common';
import {
  ApiCommonErrorResponses,
  ApiNotFoundResponse,
  ApiUnprocessableEntityResponse,
} from '@shared/docs';

export const ApiVentaErrorResponses = () => {
  return applyDecorators(
    ApiCommonErrorResponses(), // 400, 500
    ApiVentaNotFound(),
    ApiEstadoInvalido(),
  );
};

export const ApiVentaNotFound = () => {
  return ApiNotFoundResponse('Venta');
};

/**
 * Error cuando se intenta operar sobre una venta en estado incorrecto.
 */
export const ApiEstadoInvalido = () => {
  return ApiUnprocessableEntityResponse(
    'Estado de venta inválido para esta operación',
  );
};
```

### 3. Crear Decoradores de Endpoint

Un decorador por endpoint que combine toda la documentación.

**CRÍTICO**: Todas las respuestas usan la estructura `ApiResponse<T>`:

```typescript
{
  ok: boolean,
  status: number,
  data: T | null,
  errors: ErrorDetail[]
}
```

```typescript
// src/modules/comercial/docs/decorators/api-comercial.decorator.ts
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { ApiVentaErrorResponses } from './api-error-responses.decorator.js';
import {
  CREAR_VENTA_REQUEST_EXAMPLE,
  VENTA_RESPONSE_EXAMPLE,
} from '../examples/venta.examples.js';

export const ApiCrearVenta = () => {
  return applyDecorators(
    ApiTags('Comercial'),
    ApiOperation({
      summary: 'Crear nueva venta',
      description:
        'Crea venta desde carrito confirmado. Valida disponibilidad antes de reservar.',
    }),
    ApiBody({
      schema: { example: CREAR_VENTA_REQUEST_EXAMPLE },
    }),
    ApiResponse({
      status: 201,
      description: 'Venta creada',
      schema: {
        example: {
          ok: true,
          status: 201,
          data: VENTA_RESPONSE_EXAMPLE, // ← El ejemplo va dentro de 'data'
          errors: [],
        },
      },
    }),
    ApiVentaErrorResponses(),
  );
};
```

**Reglas de descripción**:

- **Summary**: Una línea corta y descriptiva
- **Description**: Máximo 2-3 líneas con contexto esencial
- NO incluir listas de reglas de negocio (eso va en `{MODULO}_CLAUDE.md`)

**Estructura de respuesta**:

- **Éxito**: `{ ok: true, status: 2xx, data: T, errors: [] }`
- **Error**: `{ ok: false, status: 4xx/5xx, data: null, errors: [...] }`

### 4. Aplicar en Controller

Importa y aplica los decoradores en cada endpoint.

```typescript
// src/modules/comercial/infrastructure/controllers/venta.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiCrearVenta } from '../../docs/decorators/api-comercial.decorator.js';

@Controller('ventas')
@ApiTags('Comercial') // Tag para agrupar en Swagger UI
export class VentaController {
  @Post()
  @ApiCrearVenta() // ← Decorador aplicado
  async crearVenta(@Body() dto: CrearVentaDto) {
    // ...
  }
}
```

---

## Decoradores Compartidos Disponibles

### Errores HTTP Comunes

Desde `@shared/docs`:

```typescript
import {
  ApiCommonErrorResponses, // 400 (validación), 500 (servidor)
  ApiNotFoundResponse, // 404
  ApiConflictResponse, // 409 (ej: concurrencia)
  ApiUnprocessableEntityResponse, // 422 (ej: estado inválido)
} from '@shared/docs';
```

**Uso**:

```typescript
export const ApiMiModuloErrorResponses = () => {
  return applyDecorators(
    ApiCommonErrorResponses(),
    ApiNotFoundResponse('MiRecurso'),
    ApiConflictResponse('Descripción del conflicto'),
  );
};
```

---

## Convenciones

### ✅ DO (Hacer)

1. **Un decorador por endpoint** con nombre descriptivo (`ApiCrearVenta`, `ApiActualizarProducto`)
2. **Ejemplos realistas** con datos válidos del dominio
3. **Descriptions concisas** (máximo 2-3 líneas)
4. **Reutilizar decoradores compartidos** de `@shared/docs`
5. **Usar `as const`** en ejemplos para type safety
6. **Tag consistente** por módulo (`ApiTags('Inventario')`)

### ❌ DON'T (No Hacer)

1. ❌ **NO duplicar lógica de negocio** - Swagger documenta HTTP, no el dominio
2. ❌ **NO hardcodear respuestas** - Usa ejemplos desde `/examples`
3. ❌ **NO descriptions largas** - Máximo 3 líneas
4. ❌ **NO omitir errores** - Documenta 4xx y 5xx relevantes
5. ❌ **NO UUIDs v4** - Usa UUIDs v7 (`01933e7f-...`)

---

## Ejemplo Completo: Módulo INVENTARIO

El módulo **INVENTARIO** implementa este patrón completamente. Úsalo como referencia:

```bash
# Ver estructura completa
tree src/modules/inventario/docs/

# Ver ejemplos
cat src/modules/inventario/docs/examples/inventario.examples.ts

# Ver decoradores
cat src/modules/inventario/docs/decorators/api-inventario.decorator.ts

# Ver controller con decoradores aplicados
cat src/modules/inventario/infrastructure/controllers/inventario.controller.ts
```

---

## Testing de Documentación

Después de implementar:

1. **Iniciar servidor**: `npm run start:dev`
2. **Abrir Swagger UI**: `http://localhost:3000/api/docs`
3. **Verificar**:
   - Módulo aparece en tags
   - Ejemplos se muestran correctamente
   - Errores están documentados
   - "Try it out" funciona

---

## Agregar Nuevo Módulo a Swagger Global

Cuando implementes un módulo nuevo, actualiza la configuración global:

```typescript
// src/shared/infrastructure/config/swagger.config.ts
const config = new DocumentBuilder()
  .setTitle('Store Backend API')
  .setDescription('...')
  .setVersion('2.1.0')
  .addTag('Inventario', 'Gestión de stock, reservas y movimientos')
  .addTag('Comercial', 'Ventas y cambios') // ← AGREGAR
  .addTag('Catálogo', 'Productos y paquetes') // ← AGREGAR
  // ...
  .build();
```

---

## Resumen de Flujo

```
1. Crear ejemplos en /examples
   ↓
2. Crear decoradores de error en /decorators/api-error-responses.decorator.ts
   ↓
3. Crear decoradores de endpoint en /decorators/api-{modulo}.decorator.ts
   ↓
4. Aplicar decoradores en controller
   ↓
5. Agregar tag en swagger.config.ts (si es módulo nuevo)
   ↓
6. Verificar en http://localhost:3000/api/docs
```

---

## Recursos

- **Módulo de referencia**: `src/modules/inventario/`
- **Decoradores compartidos**: `src/shared/docs/`
- **Configuración global**: `src/shared/infrastructure/config/swagger.config.ts`
- **NestJS Swagger Docs**: https://docs.nestjs.com/openapi/introduction

---

**Última actualización**: Enero 2026  
**Versión del patrón**: 1.0
