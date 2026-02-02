# 📋 Plan de Implementación: Módulo CONFIGURACIÓN

**Versión**: 1.0  
**Fecha**: Febrero 2026  
**Arquitectura**: Domain-Driven Design + Hexagonal Architecture  
**Duración Total**: 47 horas (2 sprints)

---

## 📌 Visión General

Este documento describe el **plan paso a paso** para implementar el módulo CONFIGURACIÓN. El módulo está compuesto por 2 agregados principales que centralizan parámetros operativos y políticas legales del negocio.

**Módulo**: CONFIGURACIÓN  
**Agregados**: 2 (ParametroOperativo, Politica)  
**Entidades BD**: 2 tablas  
**Dependencias**: NINGUNA (módulo autónomo)

### 📚 Documentación de Referencia

- **Arquitectura Hexagonal**: `docs/arquitectura/ARQUITECTURA_HEXAGONAL.md`
- **Lógica de Dominio**: `src/modules/configuracion/CONFIGURACION_CLAUDE.md`
- **Entidades de BD**: `src/modules/configuracion/CONFIGURACION_ENTITIES_CLAUDE.md`
- **Decoradores Personalizados**: `docs/arquitectura/DECORADORES_PERSONALIZADOS.md`

---

## 🏗️ FASE 1: Estructura Hexagonal (1-2 horas)

**Objetivo**: Preparar la estructura base del módulo.

### 1.1 Verificar Carpetas

```bash
# Verificar que existen:
eza -la src/modules/configuracion/

# Deberías ver:
domain/
application/
infrastructure/
```

### 1.2 Verificar Subcarpetas

```bash
# Dominio
src/modules/configuracion/domain/
├── aggregates/
│   ├── parametro-operativo/
│   │   └── parametro-operativo.entity.ts
│   ├── politica/
│   │   └── politica.entity.ts
│   └── configuracion.types.ts
├── ports/
│   ├── inbound/
│   │   └── configuracion.service.ts
│   └── outbound/
│       └── configuracion.repository.ts
├── events/
│   └── configuracion.events.ts
└── value-objects/         (.gitkeep - sin value objects por ahora)

# Aplicación
src/modules/configuracion/application/
├── services/
│   └── configuracion-application.service.ts
├── dto/
│   ├── configuracion-request.dto.ts
│   ├── configuracion-response.dto.ts
│   └── configuracion.schema.ts
└── mappers/
    └── configuracion.mapper.ts

# Infraestructura
src/modules/configuracion/infrastructure/
├── persistence/
│   ├── configuracion-postgres.repository.ts
│   └── mappers/
│       └── configuracion-persistence.mapper.ts
├── controllers/
│   └── configuracion.controller.ts
└── tokens.ts
```

### 1.3 Validar Estructura

```bash
# Compilar sin errores
npx tsc --noEmit

# Verificar estructura completa
fd "^configuracion" src/modules/configuracion/ | head -20
```

---

## 👾 FASE 2: Capa Domain (16 horas)

**Objetivo**: Implementar el núcleo del módulo (agregados, puertos, eventos).

### 2.1 Crear Types y Enums (1 hora)

**Archivo**: `src/modules/configuracion/domain/aggregates/configuracion.types.ts`

**Contenido**:

```typescript
// Enums del dominio
export enum TipoDatoEnum {
  ENTERO = 'ENTERO',
  DECIMAL = 'DECIMAL',
  BOOLEAN = 'BOOLEAN',
  TEXTO = 'TEXTO',
  DURACION = 'DURACION',
}

export enum TipoPoliticaEnum {
  CAMBIOS = 'CAMBIOS',
  ENVIOS = 'ENVIOS',
  TERMINOS = 'TERMINOS',
}

export enum EstadoPoliticaEnum {
  BORRADOR = 'BORRADOR',
  VIGENTE = 'VIGENTE',
  ARCHIVADA = 'ARCHIVADA',
}

// Props para crear ParametroOperativo
export interface CrearParametroOperativoProps {
  readonly clave: string;
  readonly nombre: string;
  readonly descripcion?: string;
  readonly tipoDato: TipoDatoEnum;
  readonly valor: string;
  readonly valorDefecto: string;
  readonly valorMinimo?: string;
  readonly valorMaximo?: string;
  readonly requiereReinicio?: boolean;
}

// Props para actualizar ParametroOperativo
export interface ActualizarParametroOperativoProps {
  readonly valor: string;
  readonly modificadoPorId?: string;
}

// Data para reconstruir desde BD
export interface ParametroOperativoData {
  readonly id: string;
  readonly clave: string;
  readonly nombre: string;
  readonly descripcion?: string;
  readonly tipoDato: TipoDatoEnum;
  readonly valor: string;
  readonly valorDefecto: string;
  readonly valorMinimo?: string;
  readonly valorMaximo?: string;
  readonly requiereReinicio: boolean;
  readonly modificadoPorId?: string;
  readonly fechaModificacion: Date;
}

// Props para crear Politica
export interface CrearPoliticaProps {
  readonly tipo: TipoPoliticaEnum;
  readonly version: string;
  readonly contenido: string;
  readonly publicadoPorId?: string;
}

// Props para publicar Politica
export interface PublicarPoliticaProps {
  readonly fechaVigenciaDesde?: Date;
  readonly publicadoPorId?: string;
}

// Data para reconstruir Politica desde BD
export interface PoliticaData {
  readonly id: string;
  readonly tipo: TipoPoliticaEnum;
  readonly version: string;
  readonly contenido: string;
  readonly estado: EstadoPoliticaEnum;
  readonly fechaVigenciaDesde?: Date;
  readonly fechaVigenciaHasta?: Date;
  readonly publicadoPorId?: string;
  readonly fechaCreacion: Date;
}
```

### 2.2 Implementar Agregado ParametroOperativo (6 horas)

**Archivo**: `src/modules/configuracion/domain/aggregates/parametro-operativo/parametro-operativo.entity.ts`

**Qué implementar**:

1. **Constructor privado**
   - Acepta objeto con todas las propiedades
   - Congelado (Object.freeze)

2. **Factory Methods**
   - `static crear(params: CrearParametroOperativoProps): ParametroOperativo`
     - Valida valor según tipo_dato
     - Valida rangos si existen límites
     - Genera UUID único
     - Emite evento ParametroOperativoCreado
   - `static desde(data: ParametroOperativoData): ParametroOperativo`
     - Reconstruye desde datos de BD
     - NO emite eventos

3. **Método de Negocio**
   - `actualizar(params: ActualizarParametroOperativoProps): void`
     - Valida nuevo valor
     - Emite evento ParametroOperativoActualizado

4. **Validaciones Privadas**
   - `validarValor(valor: string, tipo: TipoDatoEnum): void`
     - ENTERO: debe ser número entero
     - DECIMAL: debe ser número válido
     - BOOLEAN: debe ser true/false/0/1
     - DURACION: debe ser "20 minutes", "5 hours", etc.
     - TEXTO: cualquier valor válido
   - `validarRango(valor: string, minimo?: string, maximo?: string, tipo?: TipoDatoEnum): void`
     - Solo para ENTERO y DECIMAL
     - Valor >= minimo (si existe)
     - Valor <= maximo (si existe)

5. **Getters Defensivos**
   - `getId()`, `getClave()`, `getNombre()`, `getValor()`, etc.
   - `getEventos()`: retorna copia defensiva
   - `vaciarEventos()`: limpia lista de eventos

**Invariantes protegidos**:

- ✓ Clave única
- ✓ Valor validado según tipo_dato
- ✓ En rango [mínimo, máximo]
- ✓ Valores no pueden ser nulos

### 2.3 Implementar Agregado Politica (6 horas)

**Archivo**: `src/modules/configuracion/domain/aggregates/politica/politica.entity.ts`

**Qué implementar**:

1. **Constructor privado**
   - Igual que ParametroOperativo
   - Congelado

2. **Factory Methods**
   - `static crear(params: CrearPoliticaProps): Politica`
     - Valida que contenido no esté vacío
     - Inicia en estado BORRADOR
     - Emite evento PoliticaCreada
   - `static desde(data: PoliticaData): Politica`
     - Reconstruye desde BD
     - NO emite eventos

3. **Métodos de Negocio**
   - `publicar(params: PublicarPoliticaProps): void`
     - Precondición: estado debe ser BORRADOR
     - Transiciona a VIGENTE
     - Registra fecha_vigencia_desde
     - Emite evento PoliticaPublicada
   - `archivar(fechaVigenciaHasta?: Date): void`
     - Precondición: no puede estar ARCHIVADA
     - Transiciona a ARCHIVADA
     - Registra fecha_vigencia_hasta
     - Emite evento PoliticaArchivada
   - `estaVigenteEn(fecha?: Date): boolean`
     - Valida si política es vigente en fecha
     - Considera fechaVigenciaDesde y fechaVigenciaHasta

4. **Getters Defensivos**
   - `getId()`, `getTipo()`, `getVersion()`, `getEstado()`, etc.
   - `getEventos()`: retorna copia defensiva
   - `vaciarEventos()`: limpia lista

**Invariantes protegidos**:

- ✓ (tipo, version) única
- ✓ Solo UNA VIGENTE por tipo
- ✓ Transiciones válidas (BORRADOR → VIGENTE → ARCHIVADA)
- ✓ Contenido no vacío

### 2.4 Definir Puerto Inbound (1 hora)

**Archivo**: `src/modules/configuracion/domain/ports/inbound/configuracion.service.ts`

**Qué definir** (solo interfaces, sin implementación):

```typescript
export interface ConfiguracionService {
  // Parámetros
  crearParametroOperativo(params): Promise<ParametroOperativoData>;
  actualizarParametroOperativo(id, params): Promise<ParametroOperativoData>;
  obtenerParametroOperativo(id): Promise<ParametroOperativoData | null>;
  obtenerParametroPorClave(clave): Promise<ParametroOperativoData | null>;
  listarParametros(): Promise<ParametroOperativoData[]>;

  // Políticas
  crearPolitica(params): Promise<PoliticaData>;
  publicarPolitica(politicaId, fechaVigencia?): Promise<PoliticaData>;
  obtenerPoliticaVigente(tipo): Promise<PoliticaData | null>;
  listarPoliticas(tipo?): Promise<PoliticaData[]>;
}
```

### 2.5 Definir Puerto Outbound (1 hora)

**Archivo**: `src/modules/configuracion/domain/ports/outbound/configuracion.repository.ts`

**Qué definir** (solo interfaces, sin implementación):

```typescript
export interface ConfiguracionRepository {
  // Parámetros
  guardarParametro(parametro): Promise<void>;
  buscarParametroPorId(id): Promise<ParametroOperativo | null>;
  buscarParametroPorClave(clave): Promise<ParametroOperativo | null>;
  listarParametros(): Promise<ParametroOperativo[]>;

  // Políticas
  guardarPolitica(politica): Promise<void>;
  buscarPoliticaPorId(id): Promise<Politica | null>;
  buscarPoliticaVigente(tipo): Promise<Politica | null>;
  listarPoliticas(tipo?): Promise<Politica[]>;
  buscarPoliticasVigentesPorTipo(tipo): Promise<Politica[]>;
}
```

### 2.6 Definir Eventos de Dominio (1 hora)

**Archivo**: `src/modules/configuracion/domain/events/configuracion.events.ts`

**Qué definir**:

```typescript
export class ParametroOperativoCreado {
  constructor(
    readonly agregadoId: string,
    readonly clave: string,
    readonly valor: string,
    readonly occuredAt: Date = new Date(),
  ) {}
}

export class ParametroOperativoActualizado {
  constructor(
    readonly agregadoId: string,
    readonly clave: string,
    readonly valorAnterior: string,
    readonly valorNuevo: string,
    readonly requiereReinicio: boolean,
    readonly occuredAt: Date = new Date(),
  ) {}
}

export class PoliticaCreada {
  constructor(
    readonly agregadoId: string,
    readonly tipo: string,
    readonly version: string,
    readonly occuredAt: Date = new Date(),
  ) {}
}

export class PoliticaPublicada {
  constructor(
    readonly agregadoId: string,
    readonly tipo: string,
    readonly version: string,
    readonly fechaVigenciaDesde: Date,
    readonly occuredAt: Date = new Date(),
  ) {}
}

export class PoliticaArchivada {
  constructor(
    readonly agregadoId: string,
    readonly tipo: string,
    readonly version: string,
    readonly occuredAt: Date = new Date(),
  ) {}
}
```

### 2.7 Validar Fase 2

```bash
# Compilar sin errores
npx tsc --noEmit

# Verificar que los tipos están bien definidos
# Los tests se harán en FASE 6
```

---

## 📱 FASE 3: Capa Application (8 horas)

**Objetivo**: Implementar la orquestación (services, DTOs, mappers).

### 3.1 Crear DTOs de Solicitud (1 hora)

**Archivo**: `src/modules/configuracion/application/dto/configuracion-request.dto.ts`

```typescript
export class CrearParametroOperativoRequestDto {
  clave!: string;
  nombre!: string;
  descripcion?: string;
  tipoDato!: string; // Será string desde HTTP
  valor!: string;
  valorDefecto!: string;
  valorMinimo?: string;
  valorMaximo?: string;
  requiereReinicio?: boolean;
}

export class ActualizarParametroOperativoRequestDto {
  valor!: string;
}

export class CrearPoliticaRequestDto {
  tipo!: string;
  version!: string;
  contenido!: string;
}

export class PublicarPoliticaRequestDto {
  fechaVigenciaDesde?: Date;
}
```

### 3.2 Crear DTOs de Respuesta (1 hora)

**Archivo**: `src/modules/configuracion/application/dto/configuracion-response.dto.ts`

```typescript
export class ParametroOperativoResponseDto {
  id!: string;
  clave!: string;
  nombre!: string;
  descripcion?: string;
  tipoDato!: string;
  valor!: string;
  valorDefecto!: string;
  valorMinimo?: string;
  valorMaximo?: string;
  requiereReinicio!: boolean;
  modificadoPorId?: string;
  fechaModificacion!: string; // ISO string
}

export class PoliticaResponseDto {
  id!: string;
  tipo!: string;
  version!: string;
  contenido!: string;
  estado!: string;
  fechaVigenciaDesde?: string;
  fechaVigenciaHasta?: string;
  publicadoPorId?: string;
  fechaCreacion!: string;
}
```

### 3.3 Crear Schemas Zod (1 hora)

**Archivo**: `src/modules/configuracion/application/dto/configuracion.schema.ts`

```typescript
import { z } from 'zod';

export const CrearParametroOperativoSchema = z.object({
  clave: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[A-Z_]+$/),
  nombre: z.string().min(3).max(100),
  descripcion: z.string().optional(),
  tipoDato: z.enum(['ENTERO', 'DECIMAL', 'BOOLEAN', 'TEXTO', 'DURACION']),
  valor: z.string().min(1),
  valorDefecto: z.string().min(1),
  valorMinimo: z.string().optional(),
  valorMaximo: z.string().optional(),
  requiereReinicio: z.boolean().optional().default(false),
});

export const ActualizarParametroOperativoSchema = z.object({
  valor: z.string().min(1),
});

export const CrearPoliticaSchema = z.object({
  tipo: z.enum(['CAMBIOS', 'ENVIOS', 'TERMINOS']),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  contenido: z.string().min(10),
});

export const PublicarPoliticaSchema = z.object({
  fechaVigenciaDesde: z.coerce.date().optional(),
});
```

### 3.4 Crear Mappers (1 hora)

**Archivo**: `src/modules/configuracion/application/mappers/configuracion.mapper.ts`

```typescript
export class ConfiguracionMapper {
  static parameterToDto(
    data: ParametroOperativoData,
  ): ParametroOperativoResponseDto {
    return {
      id: data.id,
      clave: data.clave,
      nombre: data.nombre,
      descripcion: data.descripcion,
      tipoDato: data.tipoDato,
      valor: data.valor,
      valorDefecto: data.valorDefecto,
      valorMinimo: data.valorMinimo,
      valorMaximo: data.valorMaximo,
      requiereReinicio: data.requiereReinicio,
      modificadoPorId: data.modificadoPorId,
      fechaModificacion: data.fechaModificacion.toISOString(),
    };
  }

  static politicaToDto(data: PoliticaData): PoliticaResponseDto {
    return {
      id: data.id,
      tipo: data.tipo,
      version: data.version,
      contenido: data.contenido,
      estado: data.estado,
      fechaVigenciaDesde: data.fechaVigenciaDesde?.toISOString(),
      fechaVigenciaHasta: data.fechaVigenciaHasta?.toISOString(),
      publicadoPorId: data.publicadoPorId,
      fechaCreacion: data.fechaCreacion.toISOString(),
    };
  }
}
```

### 3.5 Implementar Application Services (3 horas)

**Archivo**: `src/modules/configuracion/application/services/configuracion-application.service.ts`

**Qué implementar**:

1. **Constructor**
   - Inyecta ConfiguracionRepository

2. **Método: crearParametroOperativo()**
   - Verifica que clave no exista
   - Llama ParametroOperativo.crear()
   - Persiste con repository
   - Retorna ParametroOperativoData

3. **Método: actualizarParametroOperativo()**
   - Obtiene parámetro existente
   - Llama agregado.actualizar()
   - Persiste con repository
   - Retorna ParametroOperativoData

4. **Método: obtenerParametroOperativo()**
   - Busca por ID
   - Retorna datos o null

5. **Método: obtenerParametroPorClave()**
   - Busca por clave (UNIQUE)
   - Retorna datos o null

6. **Método: listarParametros()**
   - Retorna lista de parámetros

7. **Método: crearPolitica()**
   - Llama Politica.crear()
   - Persiste con repository
   - Retorna PoliticaData

8. **Método: publicarPolitica()**
   - Obtiene política por ID
   - Busca políticas VIGENTES del mismo tipo
   - Archiva anteriores (si existen)
   - Publica nueva
   - Persiste cambios
   - Retorna PoliticaData

9. **Método: obtenerPoliticaVigente()**
   - Busca política VIGENTE por tipo
   - Retorna datos o null

10. **Método: listarPoliticas()**
    - Retorna lista de políticas (filtrado opcional)

### 3.6 Validar Fase 3

```bash
# Compilar
npx tsc --noEmit

# Validar que los servicios se pueden inyectar correctamente
# Los tests se harán en FASE 6
```

---

## 🔌 FASE 4: Capa Infrastructure (12 horas)

**Objetivo**: Implementar adaptadores (controllers, repositories).

### 4.1 Crear Mapper de Persistencia (2 horas)

**Archivo**: `src/modules/configuracion/infrastructure/persistence/mappers/configuracion-persistence.mapper.ts`

**Qué implementar**:

1. **Domain → Prisma (para guardar)**
   - ParametroOperativo → Prisma format
   - Politica → Prisma format

2. **Prisma → Domain (para reconstruir)**
   - Prisma data → ParametroOperativoData
   - Prisma data → PoliticaData
   - Convertir enums correctamente

### 4.2 Implementar Repositorio Prisma (4 horas)

**Archivo**: `src/modules/configuracion/infrastructure/persistence/configuracion-postgres.repository.ts`

**Qué implementar**:

1. **Métodos de Parámetros**

   ```typescript
   guardarParametro(parametro): Promise<void>
   // UPSERT usando ID

   buscarParametroPorId(id): Promise<ParametroOperativo | null>
   buscarParametroPorClave(clave): Promise<ParametroOperativo | null>
   listarParametros(): Promise<ParametroOperativo[]>
   ```

2. **Métodos de Políticas**

   ```typescript
   guardarPolitica(politica): Promise<void>
   // UPSERT usando ID

   buscarPoliticaPorId(id): Promise<Politica | null>
   buscarPoliticaVigente(tipo): Promise<Politica | null>
   listarPoliticas(tipo?): Promise<Politica[]>
   buscarPoliticasVigentesPorTipo(tipo): Promise<Politica[]>
   // CRÍTICO: verifica invariante de una sola VIGENTE
   ```

3. **Transacciones**
   - Usar $transaction para operaciones atómicas
   - Especialmente en publicarPolitica

### 4.3 Crear Controllers HTTP (4 horas)

**Archivo**: `src/modules/configuracion/infrastructure/controllers/configuracion.controller.ts`

**Qué implementar**:

```typescript
@Controller('configuracion')
export class ConfiguracionController {
  // PARÁMETROS OPERATIVOS

  @Post('parametros')
  @ValidateWith(CrearParametroOperativoSchema)
  async crearParametro(@Body() dto)

  @Patch('parametros/:id')
  @ValidateWith(ActualizarParametroOperativoSchema)
  async actualizarParametro(@Param('id') id, @Body() dto)

  @Get('parametros/:id')
  async obtenerParametro(@Param('id') id)

  @Get('parametros')
  async listarParametros()

  // POLÍTICAS

  @Post('politicas')
  @ValidateWith(CrearPoliticaSchema)
  async crearPolitica(@Body() dto)

  @Patch('politicas/:id/publicar')
  @ValidateWith(PublicarPoliticaSchema)
  async publicarPolitica(@Param('id') id, @Body() dto)

  @Get('politicas/:id')
  async obtenerPolitica(@Param('id') id)

  @Get('politicas')
  async listarPoliticas()
}
```

**Detalles**:

- Usar @ValidateWith() decorador para validación Zod
- Mapear respuestas con ConfiguracionMapper
- Manejo de errores (404 si no existe, 400 si validación falla)

### 4.4 Configurar Módulo NestJS (2 horas)

**Archivo**: `src/modules/configuracion/configuracion.module.ts`

```typescript
import { Module } from '@nestjs/common';

@Module({
  controllers: [ConfiguracionController],
  providers: [
    {
      provide: CONFIGURACION_SERVICE_TOKEN,
      useClass: ConfiguracionApplicationService,
    },
    {
      provide: CONFIGURACION_REPOSITORY_TOKEN,
      useClass: ConfiguracionPostgresRepository,
    },
  ],
  exports: [CONFIGURACION_SERVICE_TOKEN],
})
export class ConfiguracionModule {}
```

**Crear Tokens**:

**Archivo**: `src/modules/configuracion/domain/ports/tokens.ts`

```typescript
export const CONFIGURACION_SERVICE_TOKEN = Symbol('CONFIGURACION_SERVICE');
export const CONFIGURACION_REPOSITORY_TOKEN = Symbol(
  'CONFIGURACION_REPOSITORY',
);
```

### 4.5 Validar Fase 4

```bash
# Compilar
npx tsc --noEmit

# Iniciar servidor (en otra terminal)
npm run start:dev

# En otra terminal, verificar que los endpoints están registrados
curl -X GET http://localhost:3000/configuracion/parametros \
  -H "Authorization: Bearer {token}"

# Debe retornar: 200 OK (lista vacía o con parámetros)
# Los tests E2E completos se harán en FASE 6
```

---

## 💾 FASE 5: Persistencia Prisma (2 horas)

**Objetivo**: Crear tablas en base de datos.

### 5.1 Agregar Schema Prisma (1 hora)

**Archivo**: `prisma/schema.prisma` (agregar al final)

```prisma
// ==================== CONFIGURACIÓN ====================

enum TipoDato {
  ENTERO
  DECIMAL
  BOOLEAN
  TEXTO
  DURACION
}

enum TipoPolitica {
  CAMBIOS
  ENVIOS
  TERMINOS
}

enum EstadoPolitica {
  BORRADOR
  VIGENTE
  ARCHIVADA
}

model ParametroOperativo {
  id                  String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  clave               String    @unique
  nombre              String
  descripcion         String?
  tipo_dato           TipoDato
  valor               String
  valor_defecto       String
  valor_minimo        String?
  valor_maximo        String?
  requiere_reinicio   Boolean   @default(false)
  modificado_por      String?   @db.Uuid
  fecha_modificacion  DateTime  @default(now()) @db.Timestamp(3)

  @@index([clave])
  @@index([modificado_por])
  @@map("parametro_operativo")
}

model Politica {
  id                    String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tipo                  TipoPolitica
  version               String
  contenido             String
  estado                EstadoPolitica   @default(BORRADOR)
  fecha_vigencia_desde  DateTime?        @db.Date
  fecha_vigencia_hasta  DateTime?        @db.Date
  publicado_por         String?          @db.Uuid
  fecha_creacion        DateTime         @default(now()) @db.Timestamp(3)

  @@unique([tipo, version])
  @@index([tipo])
  @@index([estado])
  @@index([tipo, estado])
  @@map("politica")
}
```

### 5.2 Crear Migración (1 hora)

```bash
# Crear migración
npx prisma migrate dev --name add_configuracion

# El sistema te pedirá que confirmes los cambios
# Responde: yes

# Generar cliente Prisma
npx prisma generate

# Verificar en GUI (opcional)
npx prisma studio
```

### 5.3 Validar Fase 5

```bash
# Verificar tablas creadas
psql -d store_backend -c "\dt parametro_operativo politica;"

# Debe mostrar:
# - parametro_operativo
# - politica

# Verificar índices
psql -d store_backend -c "\d parametro_operativo;"
# Debe mostrar UNIQUE en clave

# Verificar enums
psql -d store_backend -c "\dT+ tipo_dato;"
# Debe mostrar enum con 5 valores
```

---

## 🧪 FASE 6: Testing (16 horas) - **AL FINAL**

**Objetivo**: Cubrir dominio, aplicación y API con tests.

**Por qué al final**: Una vez que toda la lógica está implementada y funcionando, los tests validarán que todo se comporta correctamente. No hay features a medias.

### 6.1 Tests Unitarios - Domain (8 horas)

**Archivo**: `src/modules/configuracion/domain/aggregates/__tests__/parametro-operativo.spec.ts`

**Qué hacer**:

1. **Test: Crear parámetro válido**
   - Crea un ParametroOperativo con datos válidos
   - Verifica que se crea correctamente
   - Verifica que emite evento

2. **Test: Fallar con tipo inválido**
   - Intenta crear con tipo DURACION pero valor "no válido"
   - Debe lanzar Error

3. **Test: Validar rangos**
   - Crea parámetro con valor fuera de rango
   - Debe lanzar Error

4. **Test: Actualizar valor**
   - Crea parámetro
   - Actualiza valor
   - Verifica nuevo valor
   - Verifica evento emitido

5. **Test: Eventos se emiten correctamente**
   - Verifica eventos emitidos
   - Limpia eventos

---

**Archivo**: `src/modules/configuracion/domain/aggregates/__tests__/politica.spec.ts`

**Qué hacer**:

1. **Test: Crear política en BORRADOR**
   - Crea Politica
   - Verifica estado BORRADOR
   - Verifica evento

2. **Test: Publicar transiciona a VIGENTE**
   - Crea política
   - Publica
   - Verifica estado VIGENTE
   - Verifica fecha_vigencia_desde

3. **Test: Archivar política**
   - Crea y publica política
   - Archiva
   - Verifica estado ARCHIVADA
   - Verifica fecha_vigencia_hasta

4. **Test: Validar transiciones**
   - Intenta publicar política que ya está VIGENTE
   - Debe lanzar Error
   - Intenta archivar política archivada
   - Debe lanzar Error

5. **Test: estaVigenteEn()**
   - Crea política vigente hoy
   - estaVigenteEn(hoy) debe retornar true
   - estaVigenteEn(mañana + 100 años) debe retornar false

### 6.2 Tests de Integración - Application (5 horas)

**Archivo**: `src/modules/configuracion/application/__tests__/configuracion-application.spec.ts`

**Qué hacer**:

1. **Test: Crear y obtener parámetro**
   - Mock de repositorio
   - Crea parámetro via service
   - Obtiene parámetro
   - Verifica datos

2. **Test: Actualizar parámetro**
   - Crea parámetro
   - Actualiza valor
   - Verifica nuevo valor

3. **Test: Crear política**
   - Crea política via service
   - Verifica estado BORRADOR

4. **Test: Publicar archiva anterior**
   - Crea política 1
   - Publica política 1
   - Crea política 2
   - Publica política 2
   - Verifica que política 1 está ARCHIVADA
   - Verifica que política 2 está VIGENTE

5. **Test: Obtener política vigente**
   - Crea y publica política
   - Obtiene política vigente
   - Verifica datos

### 6.3 Tests E2E - API (3 horas)

**Archivo**: `e2e/configuracion.e2e.spec.ts`

**Qué hacer**:

1. **Test: POST /configuracion/parametros**
   - Envía request válido
   - Verifica status 201
   - Verifica datos retornados

2. **Test: POST con validación fallida**
   - Envía clave inválida
   - Verifica status 400
   - Verifica mensaje de error

3. **Test: PATCH /configuracion/parametros/:id**
   - Crea parámetro
   - Actualiza valor
   - Verifica status 200
   - Verifica nuevo valor

4. **Test: GET /configuracion/parametros**
   - Crea múltiples parámetros
   - Obtiene lista
   - Verifica que contiene todos

5. **Test: POST /configuracion/politicas**
   - Envía request válido
   - Verifica status 201

6. **Test: PATCH /configuracion/politicas/:id/publicar**
   - Crea política
   - Publica
   - Verifica status 200
   - Verifica estado VIGENTE

7. **Test: Publicar segunda política archiva primera**
   - Crea y publica política 1
   - Crea y publica política 2 (mismo tipo)
   - Obtiene política 1
   - Verifica que está ARCHIVADA

### 6.4 Validar Fase 6

```bash
# Ejecutar todos los tests
npm test -- src/modules/configuracion

# Verificar cobertura
npm test -- src/modules/configuracion --coverage

# Debe ser:
# - Cobertura >= 80%
# - Todos los tests pasan ✓
# - Sin warnings ✓
```

---

## 📚 FASE 7: Documentación y Swagger (8 horas)

**Objetivo**: Documentar API y crear ejemplos.

### 7.1 Agregar Swagger Decorators (3 horas)

**En**: `src/modules/configuracion/infrastructure/controllers/configuracion.controller.ts`

**Qué hacer**:

1. **En cada método HTTP**

   ```typescript
   @Post('parametros')
   @ApiOperation({ summary: 'Crear parámetro operativo' })
   @ApiCreatedResponse({
     description: 'Parámetro creado',
     type: ParametroOperativoResponseDto,
   })
   @ApiBadRequestResponse({
     description: 'Validación fallida o clave duplicada',
   })
   async crearParametro(@Body() dto)
   ```

2. **Documentar todos los endpoints**
   - POST /configuracion/parametros
   - PATCH /configuracion/parametros/:id
   - GET /configuracion/parametros/:id
   - GET /configuracion/parametros
   - POST /configuracion/politicas
   - PATCH /configuracion/politicas/:id/publicar
   - GET /configuracion/politicas/:id
   - GET /configuracion/politicas

3. **Documentar DTOs**

   ```typescript
   export class CrearParametroOperativoRequestDto {
     @ApiProperty({ example: 'DURACION_RESERVA_VENTA' })
     clave!: string;

     @ApiProperty()
     nombre!: string;

     // ... resto de propiedades
   }
   ```

### 7.2 Crear README del Módulo (2 horas)

**Archivo**: `src/modules/configuracion/README.md`

**Contenido**:

```markdown
# Módulo CONFIGURACIÓN

## Responsabilidades

- Gestión de parámetros operativos
- Gestión de políticas legales versionadas

## Agregados

- ParametroOperativo
- Politica

## Invariantes Críticos

- Clave de parámetro única
- Solo UNA política VIGENTE por tipo
- Validación de valores según tipo_dato

## Cómo Usar

[incluir ejemplos]

## Cómo Extender

[incluir instrucciones]
```

### 7.3 Crear Ejemplos HTTP (1.5 horas)

**Archivo**: `src/modules/configuracion/docs/examples/`

Crear archivos `.http`:

1. **crear-parametro.http**

   ```http
   POST http://localhost:3000/configuracion/parametros
   Content-Type: application/json

   {
     "clave": "DURACION_RESERVA_VENTA",
     "nombre": "Duración de Reserva",
     "tipoDato": "DURACION",
     "valor": "20 minutes",
     "valorDefecto": "20 minutes"
   }
   ```

2. **actualizar-parametro.http**

   ```http
   PATCH http://localhost:3000/configuracion/parametros/abc123
   Content-Type: application/json

   {
     "valor": "30 minutes"
   }
   ```

3. **crear-politica.http**
4. **publicar-politica.http**

### 7.4 Validar Fase 7

```bash
# Acceder a Swagger UI
http://localhost:3000/api/docs

# Verificar:
# - Todos los endpoints documentados ✓
# - Modelos visibles ✓
# - Ejemplos funcionales ✓
```

---

## ✅ Checklist General

### Estructura y Setup

- [ ] Carpetas creadas correctamente
- [ ] TypeScript compila sin errores

### Domain Layer

- [ ] Types y Enums definidos
- [ ] Agregado ParametroOperativo implementado
- [ ] Agregado Politica implementado
- [ ] Puertos Inbound y Outbound definidos
- [ ] Eventos de dominio definidos
- [ ] Tests unitarios > 90% cobertura

### Application Layer

- [ ] DTOs Request/Response creados
- [ ] Schemas Zod validando correctamente
- [ ] Mappers bidireccionales
- [ ] Services orquestando casos de uso
- [ ] Tests de integración pasando

### Infrastructure Layer

- [ ] Mapper de persistencia
- [ ] Repositorio Prisma implementado
- [ ] Controllers HTTP funcionando
- [ ] Módulo NestJS configurado
- [ ] DI funcionando correctamente

### Persistencia

- [ ] Schema Prisma agregado
- [ ] Migración creada
- [ ] Tablas en BD con índices
- [ ] Enums en PostgreSQL
- [ ] Cliente Prisma generado

### Testing

- [ ] Unit tests > 90% en domain
- [ ] Integration tests > 80% en application
- [ ] E2E tests pasando
- [ ] Cobertura total >= 80%

### Documentación

- [ ] Swagger decorators en controllers
- [ ] README del módulo
- [ ] Ejemplos HTTP funcionales
- [ ] Diagramas incluidos

---

## 📊 Resumen de Fases

| #         | Fase           | Horas  | Validación                       | Estado          |
| --------- | -------------- | ------ | -------------------------------- | --------------- |
| 1         | Estructura     | 1-2    | Carpetas y tipos compilando ✓    | **Primero**     |
| 2         | Domain         | 16     | Agregados y puertos definidos    | **Primero**     |
| 3         | Application    | 8      | Services orquestando casos uso   | **Segundo**     |
| 4         | Infrastructure | 12     | Controllers HTTP funcionando     | **Segundo**     |
| 5         | Persistencia   | 2      | Tablas en BD con indices         | **Tercero**     |
| 7         | Documentación  | 8      | Swagger y ejemplos funcionales   | **Cuarto**      |
| 6         | Testing        | 16     | Cobertura >= 80%                 | **AL FINAL**    |
| **TOTAL** |                | **47** | **Todas las validaciones pasan** | **(sin tests)** |

---

## 🎯 Flujo de Implementación Recomendado

```
FASE 1 (1-2h)
    ↓
FASE 2 (16h) ← Domain Layer (núcleo)
    ↓
FASE 3 (8h) ← Application Layer (orquestación)
    ↓
FASE 4 (12h) ← Infrastructure Layer (adapters)
    ↓
FASE 5 (2h) ← Persistencia (tablas BD)
    ↓
FASE 7 (8h) ← Documentación (Swagger + ejemplos)
    ↓
FASE 6 (16h) ← Testing (validación final)
```

**Criterio**: Implementar todo el flujo de negocio completo ANTES de escribir tests. Los tests validan que todo funciona, no que exista.

---

## 🚀 Próximos Pasos Después de Completar

1. **Code Review**: Revisar todo el módulo según guía hexagonal
2. **Integración**: Otros módulos que necesiten CONFIGURACION
3. **Staging**: Deploy a ambiente de prueba
4. **Performance**: Tests de carga con parámetros críticos
5. **Producción**: Deploy seguro con rollback plan

---

**Versión**: 1.0  
**Fecha**: Febrero 2026  
**Duración**: 47 horas (sin tests)  
**Estado**: Listo para Implementar ✅

### Notas Importantes

- ✅ Testing se deja para el final porque el módulo es completamente independiente
- ✅ No hay dependencias de otros módulos (excepto BD)
- ✅ Las fases 1-5 dan un módulo 100% funcional
- ✅ Las fases 6-7 dan visibilidad y confianza
- ✅ Referencia: `docs/arquitectura/ARQUITECTURA_HEXAGONAL.md` para patrones
