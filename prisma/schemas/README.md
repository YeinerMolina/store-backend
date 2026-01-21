# Prisma Schemas - Arquitectura Modular

## 📁 Estructura

Este directorio contiene los **schemas modulares de Prisma** divididos por **bounded context**.

```
prisma/
├── schemas/                    ← Schemas por módulo
│   ├── base.prisma            ← Configuración base (generator + datasource)
│   ├── inventario.prisma      ← Módulo INVENTARIO
│   ├── catalogo.prisma        ← Módulo CATALOGO (futuro)
│   ├── comercial.prisma       ← Módulo COMERCIAL (futuro)
│   └── ...                    ← Más módulos
├── merge-schemas.js           ← Script de combinación
└── schema.prisma              ← ⚠️ AUTO-GENERADO (NO EDITAR)
```

---

## 🎯 Propósito

**PROBLEMA:** Un solo archivo `schema.prisma` con todos los modelos se vuelve inmanejable en proyectos grandes.

**SOLUCIÓN:** Dividir el schema en múltiples archivos por módulo y combinarlos automáticamente.

---

## 🚀 Uso

### **1. Crear un nuevo módulo**

```bash
# Crear archivo en prisma/schemas/
touch prisma/schemas/catalogo.prisma
```

```prisma
// prisma/schemas/catalogo.prisma

// ============================================================================
// MÓDULO: CATALOGO
// ============================================================================

enum TipoProducto {
  SIMPLE
  VARIABLE

  @@map("tipo_producto")
}

model Producto {
  id          String        @id @default(uuid())
  nombre      String        @db.VarChar(200)
  tipo        TipoProducto  @map("tipo")
  precio      Decimal       @db.Decimal(10, 2)

  @@map("producto")
}
```

### **2. Generar schema combinado**

```bash
# Opción 1: Solo merge
npm run schema:merge

# Opción 2: Merge + Generar cliente Prisma
npm run db:generate

# Opción 3: Merge + Crear migración
npm run db:migrate:dev
```

### **3. Verificar resultado**

```bash
# Ver schema generado
cat prisma/schema.prisma

# Debería incluir:
# - base.prisma (configuración)
# - inventario.prisma
# - catalogo.prisma
# - ... (en orden alfabético)
```

---

## 📝 Convenciones

### **Archivo: base.prisma**

- **Propósito:** Configuración del generador y datasource
- **Posición:** SIEMPRE primero
- **Contenido:**

  ```prisma
  generator client {
    provider = "prisma-client-js"
  }

  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }
  ```

### **Archivos de módulos: {modulo}.prisma**

- **Naming:** Nombre del bounded context en minúsculas
- **Orden:** Alfabético (después de base.prisma)
- **Estructura:**
  ```prisma
  // Header con descripción del módulo
  // Enums
  // Models
  ```

### **Relaciones cross-módulo**

```prisma
// ✅ CORRECTO: Referenciar modelos de otros módulos
model MovimientoInventario {
  empleadoId  String?  @map("empleado_id")

  // Comentar relación si el módulo no existe aún
  // empleado    Empleado? @relation(fields: [empleadoId], references: [id])
}

// ❌ INCORRECTO: Duplicar modelos de otros módulos
model Empleado {  // Ya existe en identidad.prisma
  // ...
}
```

---

## ⚙️ Cómo Funciona el Merge

El script `merge-schemas.js` hace lo siguiente:

1. **Lee `base.prisma`** (configuración)
2. **Lee todos los `*.prisma`** en orden alfabético
3. **Combina el contenido** con headers y separadores
4. **Escribe `schema.prisma`** en la raíz de prisma/

**Orden garantizado:**

```
schema.prisma = base.prisma + [módulos en orden alfabético]
```

---

## 🔄 Workflow de Desarrollo

### **Modificar un módulo existente**

```bash
# 1. Editar el archivo del módulo
vim prisma/schemas/inventario.prisma

# 2. Regenerar schema
npm run schema:merge

# 3. Crear migración
npm run db:migrate:dev --name update_inventario
```

### **Agregar un nuevo módulo**

```bash
# 1. Crear archivo de schema
vim prisma/schemas/pre-venta.prisma

# 2. Regenerar schema + cliente
npm run db:generate

# 3. Crear migración
npm run db:migrate:dev --name add_pre_venta_module
```

### **Modificar configuración base**

```bash
# 1. Editar base.prisma
vim prisma/schemas/base.prisma

# 2. Regenerar todo
npm run db:generate
```

---

## ⚠️ IMPORTANTE

### **NO editar schema.prisma directamente**

```bash
# ❌ NUNCA HACER ESTO:
vim prisma/schema.prisma

# ✅ SIEMPRE EDITAR LOS ARCHIVOS MODULARES:
vim prisma/schemas/inventario.prisma
npm run schema:merge
```

**¿Por qué?** Porque `schema.prisma` se regenera automáticamente y tus cambios SE PERDERÁN.

### **Comandos modificados**

Todos los comandos de Prisma ahora ejecutan `schema:merge` primero:

```json
{
  "db:generate": "npm run schema:merge && prisma generate",
  "db:migrate:dev": "npm run schema:merge && prisma migrate dev",
  "db:push": "npm run schema:merge && prisma db push"
}
```

---

## 📊 Beneficios

✅ **Organización por módulo** - Cada bounded context tiene su schema  
✅ **Escalabilidad** - Agregar módulos no afecta a otros  
✅ **Colaboración** - Equipos trabajan en archivos separados  
✅ **Revisión de código** - Diffs más pequeños y claros  
✅ **Mantenibilidad** - Encontrar/modificar modelos es más fácil

---

## 🐛 Troubleshooting

### **Error: "No se encuentra base.prisma"**

```bash
# Verificar que existe
ls prisma/schemas/base.prisma

# Si no existe, crearlo:
cp prisma/schemas/base.prisma.example prisma/schemas/base.prisma
```

### **Error: "Prisma schema is invalid"**

```bash
# 1. Verificar sintaxis de cada archivo
npx prisma validate

# 2. Ver schema generado
cat prisma/schema.prisma

# 3. Identificar archivo con error
# El error mostrará la línea en schema.prisma
# Buscar esa sección en los archivos modulares
```

### **Migraciones no detectan cambios**

```bash
# Asegurate de regenerar el schema antes
npm run schema:merge
npx prisma migrate dev
```

---

## 📚 Recursos

- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Domain-Driven Design](https://martinfowler.com/bliki/BoundedContext.html)
- Documentación del proyecto: `../CLAUDE.md`

---

**Última actualización:** Enero 2026  
**Autor:** Store Backend Team
