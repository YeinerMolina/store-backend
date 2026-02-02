# CONFIGURACIÓN Module - HTTP Request Examples

Base URL: `http://localhost:3000/api`

## Parámetros Operativos

### 1. Crear Parámetro

```http
POST /configuracion/parametros
Content-Type: application/json

{
  "clave": "DURACION_RESERVA_VENTA",
  "nombre": "Duración de Reserva para Ventas",
  "descripcion": "Tiempo en minutos que se reservan ítems cuando cliente inicia pago online",
  "tipoDato": "DURACION",
  "valor": "20",
  "valorDefecto": "20",
  "valorMinimo": "5",
  "valorMaximo": "60",
  "requiereReinicio": false
}
```

**Response (201 Created):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "clave": "DURACION_RESERVA_VENTA",
  "nombre": "Duración de Reserva para Ventas",
  "descripcion": "Tiempo en minutos que se reservan ítems cuando cliente inicia pago online",
  "tipoDato": "DURACION",
  "valor": "20",
  "valorDefecto": "20",
  "valorMinimo": "5",
  "valorMaximo": "60",
  "requiereReinicio": false,
  "modificadoPorId": null,
  "fechaModificacion": "2026-02-02T21:30:00.000Z",
  "fechaCreacion": "2026-02-02T21:30:00.000Z"
}
```

### 2. Actualizar Valor de Parámetro

```http
PATCH /configuracion/parametros/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "valor": "25",
  "modificadoPorId": "660e8400-e29b-41d4-a716-446655440001"
}
```

**Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "clave": "DURACION_RESERVA_VENTA",
  "nombre": "Duración de Reserva para Ventas",
  "tipoDato": "DURACION",
  "valor": "25",
  "valorDefecto": "20",
  "valorMinimo": "5",
  "valorMaximo": "60",
  "requiereReinicio": false,
  "modificadoPorId": "660e8400-e29b-41d4-a716-446655440001",
  "fechaModificacion": "2026-02-02T22:00:00.000Z"
}
```

### 3. Obtener Parámetro por ID

```http
GET /configuracion/parametros/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "clave": "DURACION_RESERVA_VENTA",
  "nombre": "Duración de Reserva para Ventas",
  "tipoDato": "DURACION",
  "valor": "25",
  "valorDefecto": "20",
  "valorMinimo": "5",
  "valorMaximo": "60",
  "requiereReinicio": false,
  "modificadoPorId": "660e8400-e29b-41d4-a716-446655440001",
  "fechaModificacion": "2026-02-02T22:00:00.000Z"
}
```

### 4. Obtener Parámetro por Clave (Recomendado)

```http
GET /configuracion/parametros/clave/DURACION_RESERVA_VENTA
```

**Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "clave": "DURACION_RESERVA_VENTA",
  "nombre": "Duración de Reserva para Ventas",
  "tipoDato": "DURACION",
  "valor": "25",
  "valorDefecto": "20",
  "valorMinimo": "5",
  "valorMaximo": "60",
  "requiereReinicio": false,
  "modificadoPorId": "660e8400-e29b-41d4-a716-446655440001",
  "fechaModificacion": "2026-02-02T22:00:00.000Z"
}
```

### 5. Listar Todos los Parámetros

```http
GET /configuracion/parametros
```

**Response (200 OK):**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "clave": "DURACION_RESERVA_VENTA",
    "nombre": "Duración de Reserva para Ventas",
    "tipoDato": "DURACION",
    "valor": "25",
    "valorDefecto": "20",
    "valorMinimo": "5",
    "valorMaximo": "60",
    "requiereReinicio": false,
    "modificadoPorId": null,
    "fechaModificacion": "2026-02-02T21:30:00.000Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "clave": "UMBRAL_STOCK_BAJO",
    "nombre": "Umbral de Stock Bajo",
    "tipoDato": "ENTERO",
    "valor": "10",
    "valorDefecto": "10",
    "valorMinimo": "1",
    "valorMaximo": "1000",
    "requiereReinicio": false,
    "modificadoPorId": null,
    "fechaModificacion": "2026-02-02T21:30:00.000Z"
  }
]
```

---

## Políticas

### 1. Crear Política (BORRADOR state)

```http
POST /configuracion/politicas
Content-Type: application/json

{
  "tipo": "CAMBIOS",
  "version": "1.0.0",
  "contenido": "# Política de Cambios - v1.0.0\n\n## Elegibilidad\n- Producto debe estar sin usar\n- Cambio debe solicitarse dentro de 30 días\n- No aplica en liquidación"
}
```

**Response (201 Created):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440010",
  "tipo": "CAMBIOS",
  "version": "1.0.0",
  "contenido": "# Política de Cambios - v1.0.0\n\n## Elegibilidad\n- Producto debe estar sin usar\n...",
  "estado": "BORRADOR",
  "fechaVigenciaDesde": null,
  "fechaVigenciaHasta": null,
  "publicadoPorId": null,
  "fechaCreacion": "2026-02-02T22:00:00.000Z"
}
```

### 2. Publicar Política (BORRADOR → VIGENTE)

```http
PATCH /configuracion/politicas/550e8400-e29b-41d4-a716-446655440010/publicar
Content-Type: application/json

{
  "fechaVigenciaDesde": "2026-02-15",
  "publicadoPorId": "660e8400-e29b-41d4-a716-446655440001"
}
```

**Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440010",
  "tipo": "CAMBIOS",
  "version": "1.0.0",
  "contenido": "# Política de Cambios - v1.0.0\n\n## Elegibilidad\n...",
  "estado": "VIGENTE",
  "fechaVigenciaDesde": "2026-02-15",
  "fechaVigenciaHasta": null,
  "publicadoPorId": "660e8400-e29b-41d4-a716-446655440001",
  "fechaCreacion": "2026-02-02T22:00:00.000Z"
}
```

**Note:** Previous VIGENTE policy of type CAMBIOS is automatically archived.

### 3. Obtener Política por ID

```http
GET /configuracion/politicas/550e8400-e29b-41d4-a716-446655440010
```

**Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440010",
  "tipo": "CAMBIOS",
  "version": "1.0.0",
  "contenido": "# Política de Cambios - v1.0.0\n\n## Elegibilidad\n...",
  "estado": "VIGENTE",
  "fechaVigenciaDesde": "2026-02-15",
  "fechaVigenciaHasta": null,
  "publicadoPorId": "660e8400-e29b-41d4-a716-446655440001",
  "fechaCreacion": "2026-02-02T22:00:00.000Z"
}
```

### 4. Obtener Política Vigente por Tipo

```http
GET /configuracion/politicas/vigente/CAMBIOS
```

**Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440010",
  "tipo": "CAMBIOS",
  "version": "1.0.0",
  "contenido": "# Política de Cambios - v1.0.0\n\n## Elegibilidad\n...",
  "estado": "VIGENTE",
  "fechaVigenciaDesde": "2026-02-15",
  "fechaVigenciaHasta": null,
  "publicadoPorId": "660e8400-e29b-41d4-a716-446655440001",
  "fechaCreacion": "2026-02-02T22:00:00.000Z"
}
```

### 5. Listar Políticas (con filtro opcional por tipo)

```http
GET /configuracion/politicas
```

**Response (200 OK):**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "tipo": "CAMBIOS",
    "version": "0.9.0",
    "estado": "ARCHIVADA",
    "fechaVigenciaDesde": "2025-06-01",
    "fechaVigenciaHasta": "2026-02-14",
    "publicadoPorId": "660e8400-e29b-41d4-a716-446655440002",
    "fechaCreacion": "2025-06-01T10:00:00.000Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440011",
    "tipo": "CAMBIOS",
    "version": "1.0.0",
    "estado": "VIGENTE",
    "fechaVigenciaDesde": "2026-02-15",
    "fechaVigenciaHasta": null,
    "publicadoPorId": "660e8400-e29b-41d4-a716-446655440001",
    "fechaCreacion": "2026-02-02T22:00:00.000Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440012",
    "tipo": "CAMBIOS",
    "version": "1.1.0",
    "estado": "BORRADOR",
    "fechaVigenciaDesde": null,
    "fechaVigenciaHasta": null,
    "publicadoPorId": null,
    "fechaCreacion": "2026-02-02T23:00:00.000Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440013",
    "tipo": "ENVIOS",
    "version": "2.1.0",
    "estado": "VIGENTE",
    "fechaVigenciaDesde": "2026-01-01",
    "fechaVigenciaHasta": null,
    "publicadoPorId": "660e8400-e29b-41d4-a716-446655440001",
    "fechaCreacion": "2026-01-01T08:00:00.000Z"
  }
]
```

**Filter by type:**

```http
GET /configuracion/politicas?tipo=CAMBIOS
```

---

## Error Responses

### 400 Bad Request - Validation Error

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": {
    "clave": "Clave must be uppercase with underscores"
  }
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Parámetro no encontrado",
  "error": "Not Found"
}
```

### 409 Conflict - Duplicate Key

```json
{
  "statusCode": 409,
  "message": "Parámetro con clave DURACION_RESERVA_VENTA ya existe",
  "error": "Conflict"
}
```

---

## Testing with cURL

### Create Parameter

```bash
curl -X POST http://localhost:3000/api/configuracion/parametros \
  -H "Content-Type: application/json" \
  -d '{
    "clave": "DURACION_RESERVA_VENTA",
    "nombre": "Duración de Reserva para Ventas",
    "tipoDato": "DURACION",
    "valor": "20",
    "valorDefecto": "20",
    "valorMinimo": "5",
    "valorMaximo": "60"
  }'
```

### Get by Clave (Recommended)

```bash
curl http://localhost:3000/api/configuracion/parametros/clave/DURACION_RESERVA_VENTA
```

### List All Parameters

```bash
curl http://localhost:3000/api/configuracion/parametros
```

### Create Policy

```bash
curl -X POST http://localhost:3000/api/configuracion/politicas \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "CAMBIOS",
    "version": "1.0.0",
    "contenido": "# Política de Cambios v1.0.0"
  }'
```

### Publish Policy

```bash
curl -X PATCH http://localhost:3000/api/configuracion/politicas/{id}/publicar \
  -H "Content-Type: application/json" \
  -d '{
    "fechaVigenciaDesde": "2026-02-15",
    "publicadoPorId": "660e8400-e29b-41d4-a716-446655440001"
  }'
```

### Get Active Policy by Type

```bash
curl http://localhost:3000/api/configuracion/politicas/vigente/CAMBIOS
```
