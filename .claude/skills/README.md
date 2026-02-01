# Skills del Proyecto

Este directorio contiene **skills** (patrones de código y mejores prácticas) que se activan automáticamente cuando trabajas en contextos específicos del proyecto.

## ¿Qué son las Skills?

Las skills son guías autocontenidas que definen:

- **Patrones obligatorios** (✅ CORRECTO vs ❌ INCORRECTO)
- **Mejores prácticas** específicas de tecnologías
- **Convenciones de código** del proyecto
- **Ejemplos concretos** aplicables

## Skills Disponibles

### 1. TypeScript (`typescript/`)

**Se activa cuando**: Escribes código TypeScript, defines tipos, interfaces o enums.

**Patrones clave**:

- Const Types Pattern (objeto const + type inference)
- Interfaces planas (un nivel de profundidad)
- Nunca usar `any`, preferir `unknown` + type guards
- Utility types de TypeScript

**Ejemplos de uso**:

- Definir enums del dominio (`TipoOperacionEnum`)
- Crear types en `domain/aggregates/{entidad}/{entidad}.types.ts`
- Trabajar con genéricos en factories y value objects

### 2. Zod 4 (`zod-4/`)

**Se activa cuando**: Defines DTOs de aplicación o schemas de validación.

**Patrones clave**:

- Validadores top-level de Zod 4 (`z.email()`, `z.uuid()`, `z.url()`)
- NO usar patterns de Zod 3 (`z.string().email()` ❌)
- Error messages personalizados con `{ error: "mensaje" }`
- `safeParse()` para validaciones no-críticas

**Ejemplos de uso**:

- DTOs en `application/dto/*.dto.ts`
- Schemas de validación HTTP
- Validación de entrada de controllers

### 3. Code Documenter (`code-documenter/`)

**Se activa cuando**: Documentas código, agregas comentarios JSDoc o revisas documentación.

**Patrones clave**:

- Comentar el **WHY** (razón), nunca el **WHAT** (qué hace)
- Documentar **side effects** y comportamientos no obvios
- Usar JSDoc en TypeScript (`/** */`)
- NO comentar nombres obvios o lógica simple

**Ejemplos de uso**:

- Documentar decisiones arquitectónicas en código
- Explicar por qué se usa UUID v7 en lugar de v4
- Documentar trade-offs de algoritmos o patrones

## Cómo Funcionan

### Carga Automática

Las skills se cargan automáticamente cuando el contexto lo requiere:

```typescript
// Al escribir esto → TypeScript skill se activa
const EstadoVentaEnum = {
  BORRADOR: "BORRADOR",
  CONFIRMADA: "CONFIRMADA",
} as const;

type EstadoVenta = (typeof EstadoVentaEnum)[keyof typeof EstadoVentaEnum];

// Al escribir esto → Zod 4 skill se activa
const crearVentaSchema = z.object({
  clienteId: z.uuid({ error: "ID de cliente inválido" }),
  items: z.array(z.object({
    productoId: z.uuid(),
    cantidad: z.number().int().positive(),
  })),
});

// Al escribir esto → Code Documenter skill se activa
/**
 * Usa reservas con expiración de 20 minutos para evitar
 * bloqueo de inventario por carritos abandonados.
 *
 * @throws {InventarioInsuficienteError} Si no hay stock disponible
 */
async reservarInventario(props: ReservarProps): Promise<Reserva>
```

### Consulta Manual

Puedes consultar cualquier skill manualmente:

```bash
# Leer skill completa
cat .claude/skills/typescript/SKILL.md
cat .claude/skills/zod-4/SKILL.md
cat .claude/skills/code-documenter/SKILL.md

# Buscar patrón específico
rg "Const Types Pattern" .claude/skills/typescript/SKILL.md
rg "z.email" .claude/skills/zod-4/SKILL.md
```

## Agregar Nueva Skill

Si necesitas agregar una skill específica para este proyecto (ej: NestJS, Prisma, testing):

1. **Crear directorio**:

   ```bash
   mkdir .claude/skills/nestjs-ddd
   ```

2. **Crear `SKILL.md`** con este formato:

   ````markdown
   ---
   name: nestjs-ddd
   description: >
     Patrones de NestJS con DDD y arquitectura hexagonal.
     Trigger: Al escribir módulos, controllers, services de NestJS.
   license: Apache-2.0
   metadata:
     author: your-name
     version: '1.0'
   ---

   ## Patrón 1: Módulos Hexagonales

   ```typescript
   // ✅ CORRECTO
   @Module({
     providers: [
       InventarioApplicationService,
       {
         provide: 'InventarioRepository',
         useClass: InventarioRepositoryPostgres,
       },
     ],
   })
   export class InventarioModule {}

   // ❌ INCORRECTO
   // No inyectar implementaciones directamente
   ```
   ````

   ## Keywords

   nestjs, ddd, hexagonal, modules, dependency-injection

   ```

   ```

3. **Actualizar CLAUDE.md**:
   - Agregar entrada en la tabla de skills
   - Documentar cuándo se activa
   - Incluir ejemplos de uso

## Estructura de una Skill

```
.claude/skills/{nombre-skill}/
└── SKILL.md
    ├── Metadata (name, description, trigger)
    ├── Patrones (✅ correcto vs ❌ incorrecto)
    ├── Ejemplos concretos
    └── Keywords
```

## Integración con el Proyecto

Las skills están integradas con:

- **CLAUDE.md**: Documentación principal del proyecto
- **Arquitectura Hexagonal**: Módulos domain/application/infrastructure
- **Convenciones del proyecto**: Nomenclatura, estándares, patrones

Ver `CLAUDE.md` sección "Skills y Patrones de Código" para documentación completa.

## Notas Importantes

- Las skills son **prescriptivas**: definen cómo DEBE escribirse el código
- Los patrones marcados con ❌ **NO deben usarse** bajo ninguna circunstancia
- Múltiples skills pueden activarse simultáneamente (ej: TypeScript + Zod + Code Documenter)
- Las skills son específicas de tecnología, no de dominio de negocio

---

**Para más información**, consulta la sección "Skills y Patrones de Código" en el archivo raíz `CLAUDE.md`.
