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

### 3. Hexagonal Module (`hexagonal-module/`)

**Se activa cuando**: Creás un módulo nuevo, agregás archivos a un módulo existente, validás responsabilidades de archivos, o trabajás con puertos, adaptadores, agregados o tokens de DI.

**Patrones clave**:

- Estructura exacta de archivos para cada módulo hexagonal
- Tabla de decisión: "dónde va este archivo" por capa
- Reglas de dependencia estrictas (domain -> nada, app -> domain, infra -> domain+app)
- Convenciones de nombres para puertos, adaptadores, servicios
- Patrón de agregado DDD (1 agregado = 1 repository)
- Wiring de DI con tokens Symbol
- Tres modelos separados (Domain, Prisma, DTO)

**Ejemplos de uso**:

- Iniciar un módulo nuevo desde cero
- Decidir en qué capa y path crear un archivo
- Configurar el módulo NestJS con inyección de dependencias
- Implementar un repositorio con persistencia declarativa

### 4. NestJS Expert (`nestjs-expert/`)

**Se activa cuando**: Trabajás con módulos NestJS, inyección de dependencias, middleware, guards, interceptors, testing o autenticación.

**Patrones clave**:

- Resolución de dependencias y errores comunes
- Patrones de módulos, providers y exports
- Testing con Jest/Supertest
- Autenticación JWT + Passport
- Decision trees para arquitectura

### 5. Code Comments Policy (Global: `~/.claude/skills/code-comments-policy/`)

**Se activa cuando**: Escribís, editás o generás código en CUALQUIER lenguaje.

**Nota**: Esta skill es GLOBAL, aplica a todos los proyectos. No está en este directorio sino en `~/.claude/skills/code-comments-policy/`.

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

// Al escribir esto → Code Comments Policy skill se activa
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
cat ~/.claude/skills/code-comments-policy/SKILL.md

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
- Múltiples skills pueden activarse simultáneamente (ej: TypeScript + Zod + Code Comments Policy)
- Las skills son específicas de tecnología, no de dominio de negocio

---

**Para más información**, consulta la sección "Skills y Patrones de Código" en el archivo raíz `CLAUDE.md`.
