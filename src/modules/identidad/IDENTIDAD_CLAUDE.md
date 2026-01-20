# Módulo IDENTIDAD

**Contexto**: IDENTIDAD  
**Responsabilidad**: Gestión de terceros (personas y empresas) y sus roles específicos  
**Archivo de Entidades**: `IDENTIDAD_ENTITIES_CLAUDE.md`

---

## Visión del Módulo

El módulo IDENTIDAD es el contexto delimitado que gestiona todos los actores externos con los que la tienda interactúa. Un **Tercero** es la entidad base que representa a cualquier persona (natural) o empresa (jurídica), y puede asumir múltiples roles:

- **Empleado**: Trabajador de la tienda con acceso al sistema
- **Proveedor de Bienes**: Suministra productos para el catálogo
- **Proveedor de Servicios**: Ofrece servicios externos (ej: envíos)

Un tercero puede tener MÚLTIPLES roles simultáneamente (ej: ser proveedor de bienes Y empleado).

---

## Responsabilidades del Módulo

### Responsabilidades Principales

1. **Gestión de Terceros**:
   - Registro de personas naturales y jurídicas
   - Información fiscal y de contacto
   - Activación/desactivación de terceros

2. **Gestión de Empleados**:
   - Vinculación laboral (fecha ingreso/egreso)
   - Códigos de empleado únicos
   - Control de estado (activo/inactivo/suspendido)

3. **Gestión de Proveedores de Bienes**:
   - Registro de proveedores comerciales
   - Condiciones comerciales (plazos de pago, descuentos)
   - Relación con productos del catálogo

4. **Gestión de Proveedores de Servicios**:
   - Registro de proveedores de servicios externos
   - Configuraciones de integración (API keys, endpoints)
   - Gestión especializada por tipo de servicio

### Responsabilidades Fuera del Alcance

- **Autenticación y autorización**: Ver módulo SEGURIDAD
- **Gestión de clientes**: Ver módulo COMERCIAL (Cliente está en ese bounded context)
- **Generación de documentos fiscales**: Ver módulo FISCAL

---

## Modelo de Dominio

### Agregado: Tercero

**Aggregate Root**: Tercero

**Entidades del Agregado**:

- Tercero (root)
- Empleado (rol especializado)
- ProveedorBienes (rol especializado)
- ProveedorServicios (rol especializado)

**Invariantes del Agregado**:

1. Un Tercero debe tener información fiscal mínima:
   - tipo_documento + numero_documento únicos en el sistema
   - nombre_completo completo

2. Un Empleado SIEMPRE debe estar vinculado a un Tercero existente

3. Un Empleado solo puede ser creado por otro Empleado (trazabilidad)

4. Un Proveedor (de cualquier tipo) SIEMPRE debe estar vinculado a un Tercero existente

5. Los códigos de empleado y proveedor son únicos en todo el sistema

6. Un Tercero puede tener múltiples roles simultáneamente (ser empleado Y proveedor)

7. **NO SE ELIMINAN físicamente**: Se desactivan con estados o fechas

---

## Casos de Uso

### CU-ID-01: Registrar Tercero

**Actor**: Empleado (con permiso)

**Flujo Principal**:

1. Empleado proporciona datos del tercero:
   - tipo_persona (NATURAL / JURIDICA)
   - tipo_documento + numero_documento
   - nombre_completo
   - email, teléfono (opcionales)
   - dirección, ciudad (opcionales)
   - informacion_fiscal (JSON con RUT, régimen, etc.)

2. Sistema valida:
   - Que el par (tipo_documento, numero_documento) NO exista
   - Que email sea válido si se proporciona

3. Sistema crea Tercero con estado ACTIVO

4. Sistema registra EventoDominio: `TerceroRegistrado`

**Flujos Alternativos**:

- Si el par (tipo_documento, numero_documento) ya existe → rechazar con error específico
- Si es persona JURIDICA, validar que tipo_documento sea NIT

**Postcondiciones**:

- Tercero creado y disponible para asignar roles

---

### CU-ID-02: Vincular Empleado

**Actor**: Empleado (con permiso GESTIONAR_EMPLEADOS)

**Precondiciones**:

- El Tercero debe existir y estar ACTIVO

**Flujo Principal**:

1. Empleado selecciona Tercero
2. Empleado proporciona:
   - codigo_empleado (generado automáticamente o manual)
   - fecha_ingreso

3. Sistema valida:
   - Que el Tercero exista y esté ACTIVO
   - Que el codigo_empleado sea único
   - Que fecha_ingreso no sea futura

4. Sistema crea Empleado vinculado al Tercero
5. Sistema registra empleado_id del creador (trazabilidad)
6. Estado inicial: ACTIVO
7. Sistema registra EventoDominio: `EmpleadoVinculado`

**Flujos Alternativos**:

- Si el Tercero ya tiene un Empleado ACTIVO → permitir (puede reactivarse)
- Si codigo_empleado ya existe → rechazar

**Postcondiciones**:

- Empleado vinculado y disponible para asignar perfiles de seguridad

---

### CU-ID-03: Dar de Baja Empleado

**Actor**: Empleado (con permiso GESTIONAR_EMPLEADOS)

**Precondiciones**:

- Empleado debe existir y estar ACTIVO

**Flujo Principal**:

1. Empleado selecciona empleado a dar de baja
2. Empleado especifica fecha_egreso (puede ser retroactiva o futura)
3. Sistema valida:
   - Que el empleado exista
   - Que fecha_egreso sea >= fecha_ingreso

4. Sistema actualiza:
   - fecha_egreso con la fecha proporcionada
   - estado = INACTIVO

5. Sistema registra EventoDominio: `EmpleadoDeBaja`
6. Sistema emite evento para que SEGURIDAD revoque accesos

**Postcondiciones**:

- Empleado desactivado pero datos preservados (auditoría)

---

### CU-ID-04: Registrar Proveedor de Bienes

**Actor**: Empleado (con permiso GESTIONAR_PROVEEDORES)

**Precondiciones**:

- El Tercero debe existir

**Flujo Principal**:

1. Empleado selecciona Tercero
2. Empleado proporciona:
   - codigo_proveedor (generado o manual)
   - fecha_inicio_relacion
   - dias_pago (opcional)
   - descuento_pronto_pago (opcional)
   - notas_comerciales (opcional)

3. Sistema valida:
   - Que el Tercero exista
   - Que el codigo_proveedor sea único
   - Que descuento_pronto_pago esté en rango [0, 100] si se proporciona

4. Sistema crea ProveedorBienes vinculado al Tercero
5. Estado inicial: ACTIVO
6. Sistema registra EventoDominio: `ProveedorBienesRegistrado`

**Postcondiciones**:

- Proveedor disponible para vincularse a productos en CATALOGO

---

### CU-ID-05: Registrar Proveedor de Servicios

**Actor**: Empleado (con permiso GESTIONAR_PROVEEDORES)

**Precondiciones**:

- El Tercero debe existir

**Flujo Principal**:

1. Empleado selecciona Tercero
2. Empleado proporciona:
   - codigo_proveedor (generado o manual)
   - tipo_servicio (ENVIO, OTRO)
   - configuracion_integracion (JSON con API keys, URLs, etc.)

3. Sistema valida:
   - Que el Tercero exista
   - Que el codigo_proveedor sea único
   - Que configuracion_integracion tenga estructura válida según tipo_servicio

4. Sistema crea ProveedorServicios vinculado al Tercero
5. Estado inicial: ACTIVO
6. Sistema registra EventoDominio: `ProveedorServiciosRegistrado`

**Postcondiciones**:

- Proveedor disponible para crear envíos en LOGISTICA

---

### CU-ID-06: Desactivar Proveedor

**Actor**: Empleado (con permiso GESTIONAR_PROVEEDORES)

**Flujo Principal**:

1. Empleado selecciona proveedor (bienes o servicios)
2. Empleado solicita desactivación
3. Sistema valida:
   - Que el proveedor exista
   - (Para bienes) Advertir si tiene productos activos asociados

4. Sistema actualiza estado = INACTIVO
5. Sistema registra EventoDominio: `ProveedorDesactivado`

**Flujos Alternativos**:

- Si el proveedor tiene relaciones activas → mostrar advertencia pero permitir (soft delete)

**Postcondiciones**:

- Proveedor no disponible para nuevas relaciones

---

### CU-ID-07: Actualizar Información de Tercero

**Actor**: Empleado (con permiso)

**Flujo Principal**:

1. Empleado selecciona Tercero
2. Empleado modifica campos permitidos:
   - email
   - telefono
   - direccion
   - ciudad
   - informacion_fiscal

3. Sistema valida:
   - Que el Tercero exista
   - Formato de email si se cambia

4. Sistema actualiza campos
5. Sistema actualiza fecha_modificacion
6. Sistema registra EventoDominio: `TerceroActualizado`

**Restricciones**:

- NO se puede cambiar tipo_documento ni numero_documento (datos inmutables)
- NO se puede cambiar tipo_persona

**Postcondiciones**:

- Datos actualizados y trazables

---

## Reglas de Negocio

### RN-ID-01: Unicidad de Documento

Un par (tipo_documento, numero_documento) identifica ÚNICAMENTE a un Tercero en el sistema.

**Implementación**: Constraint único en base de datos.

---

### RN-ID-02: Múltiples Roles

Un Tercero puede ser simultáneamente:

- Empleado
- Proveedor de Bienes
- Proveedor de Servicios

**Implementación**: Las tablas de roles apuntan a tercero_id, sin restricción de exclusividad.

---

### RN-ID-03: Trazabilidad de Creación de Empleados

Todo Empleado debe tener registrado quién lo creó (empleado_id en `creado_por`).

**Excepción**: El primer empleado del sistema (bootstrap) puede tener `creado_por = NULL`.

---

### RN-ID-04: Inmutabilidad de Identificación Fiscal

Una vez creado el Tercero, su tipo_documento y numero_documento NO pueden modificarse.

**Razón**: Integridad referencial y auditoría.

---

### RN-ID-05: Validación de Email

Si se proporciona email, debe tener formato válido (expresión regular estándar).

---

### RN-ID-06: Proveedor Servicios Requiere Configuración

Un ProveedorServicios con tipo_servicio = ENVIO DEBE tener configuracion_integracion válida.

**Validación**: JSON debe contener al menos `{ "api_url": "...", "api_key": "..." }`

---

### RN-ID-07: Descuento Pronto Pago

El descuento debe estar en rango [0.00, 100.00] (porcentaje).

---

### RN-ID-08: Fecha Egreso Coherente

Si un Empleado tiene fecha_egreso, esta debe ser >= fecha_ingreso.

---

## Validaciones

| Campo                 | Validación                                |
| --------------------- | ----------------------------------------- |
| tipo_documento        | Enum válido: CC, NIT, CE, PASAPORTE       |
| numero_documento      | No vacío, máx 20 caracteres, alfanumérico |
| nombre_completo       | No vacío, máx 200 caracteres              |
| email                 | Formato email válido (si se proporciona)  |
| telefono              | Máx 20 caracteres (si se proporciona)     |
| codigo_empleado       | Único en sistema, máx 20 caracteres       |
| codigo_proveedor      | Único en sistema, máx 20 caracteres       |
| descuento_pronto_pago | 0.00 <= valor <= 100.00                   |
| dias_pago             | >= 0                                      |
| tipo_servicio         | Enum válido                               |

---

## Eventos de Dominio

| Evento                         | Cuándo se Emite                  | Payload Clave                                        |
| ------------------------------ | -------------------------------- | ---------------------------------------------------- |
| `TerceroRegistrado`            | Al crear un tercero              | tercero_id, tipo_persona, numero_documento           |
| `TerceroActualizado`           | Al modificar datos de tercero    | tercero_id, campos modificados                       |
| `TerceroDesactivado`           | Al desactivar un tercero         | tercero_id                                           |
| `EmpleadoVinculado`            | Al crear empleado                | empleado_id, tercero_id, codigo_empleado, creado_por |
| `EmpleadoDeBaja`               | Al dar de baja                   | empleado_id, fecha_egreso                            |
| `EmpleadoSuspendido`           | Al suspender                     | empleado_id, motivo                                  |
| `ProveedorBienesRegistrado`    | Al registrar proveedor bienes    | proveedor_id, tercero_id, codigo_proveedor           |
| `ProveedorServiciosRegistrado` | Al registrar proveedor servicios | proveedor_id, tercero_id, tipo_servicio              |
| `ProveedorDesactivado`         | Al desactivar proveedor          | proveedor_id, tipo (bienes/servicios)                |

---

## Integraciones con Otros Módulos

### Este módulo PROVEE a:

#### COMERCIAL

- **Tercero**: Para vincular a Cliente (Cliente hereda/referencia información fiscal)

#### INVENTARIO

- **Empleado**: Para registrar quién ejecuta MovimientosInventario manuales

#### FISCAL

- **Tercero**: Para información tributaria en DocumentosFiscales

#### SEGURIDAD

- **Empleado**: Para autenticación y asignación de perfiles

#### CATALOGO

- **ProveedorBienes**: Para vincular productos a su proveedor

#### LOGISTICA

- **ProveedorServicios**: Para crear envíos con proveedores externos

### Este módulo CONSUME de:

#### AUDITORIA

- **EventoDominio**: Todos los eventos de identidad se registran aquí

**NOTA**: IDENTIDAD no depende funcionalmente de otros módulos. Es un módulo fundamental.

---

## Consideraciones de Implementación

### Control de Concurrencia

- No requiere optimistic locking en operaciones normales
- Las operaciones de creación son idempotentes por constraint único de documento

### Índices Requeridos

- `(tipo_documento, numero_documento)` - único, critical
- `tercero.email` - único parcial (solo si no es null)
- `empleado.codigo_empleado` - único
- `proveedor_bienes.codigo_proveedor` - único
- `proveedor_servicios.codigo_proveedor` - único
- `empleado.estado` - para filtros de empleados activos

### Datos Sensibles

- `informacion_fiscal` contiene datos tributarios: requiere encriptación en tránsito
- `configuracion_integracion` contiene API keys: requiere encriptación en reposo

### Performance

- Consultas más frecuentes:
  - Búsqueda de empleado por código
  - Búsqueda de tercero por documento
  - Listado de empleados activos

---

## Checklist de Implementación

### Entidades

- [ ] Crear tabla `tercero` con constraint único
- [ ] Crear tabla `empleado` con FK a tercero
- [ ] Crear tabla `proveedor_bienes` con FK a tercero
- [ ] Crear tabla `proveedor_servicios` con FK a tercero

### Casos de Uso

- [ ] Implementar RegistrarTercero
- [ ] Implementar VincularEmpleado
- [ ] Implementar DarDeBajaEmpleado
- [ ] Implementar RegistrarProveedorBienes
- [ ] Implementar RegistrarProveedorServicios
- [ ] Implementar DesactivarProveedor
- [ ] Implementar ActualizarTercero

### Validaciones

- [ ] Validación de unicidad de documento
- [ ] Validación de formato de email
- [ ] Validación de códigos únicos
- [ ] Validación de fechas coherentes
- [ ] Validación de rangos de descuento

### Eventos

- [ ] Emitir eventos de dominio en todas las operaciones
- [ ] Registrar eventos en AUDITORIA

---

## Referencias

- **Entidades de Base de Datos**: Ver `IDENTIDAD_ENTITIES_CLAUDE.md`
- **Seguridad y Permisos**: Ver `SEGURIDAD_CLAUDE.md`
- **Auditoría**: Ver `AUDITORIA_CLAUDE.md`

---

**Este archivo es autocontenido. Un agente puede implementar el módulo IDENTIDAD completo leyendo solo este archivo y su archivo de entidades correspondiente.**
