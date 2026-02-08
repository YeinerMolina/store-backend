# Módulo CONFIGURACIÓN

**Contexto**: CONFIGURACION  
**Responsabilidad**: Parámetros operativos y políticas del negocio  
**Archivo de Entidades**: `CONFIGURACION_ENTITIES_CLAUDE.md`

---

## Visión

Centraliza la configuración operativa del sistema sin necesidad de recompilación. Permite ajustar comportamientos clave (tiempos de reserva, umbrales, etc.) en caliente.

---

## Responsabilidades

1. **Gestión de Parámetros Operativos**: Valores configurables del sistema
2. **Gestión de Políticas**: Textos legales (cambios, envíos, términos)

---

## Agregado: ParametroOperativo

**Root**: ParametroOperativo  
**Invariantes**:

- Clave única por parámetro
- Tipo de dato definido (validación según tipo)
- Algunos parámetros requieren reinicio del sistema

---

## Parámetros Clave del Sistema

| Clave                              | Tipo   | Default | Descripción                                    |
| ---------------------------------- | ------ | ------- | ---------------------------------------------- |
| `DURACION_RESERVA_VENTA`           | ENTERO | 1200    | Tiempo de reserva para ventas (segundos)       |
| `DURACION_RESERVA_CAMBIO`          | ENTERO | 1200    | Tiempo de reserva para cambios (segundos)      |
| `UMBRAL_STOCK_BAJO`                | ENTERO | 10      | Trigger de notificación de stock               |
| `MAX_REINTENTOS_NOTIFICACION`      | ENTERO | 3       | Reintentos de envío                            |
| `INTERVALO_REINTENTO_NOTIFICACION` | ENTERO | 300     | Tiempo entre reintentos (segundos)             |
| `HORAS_EXPIRACION_CARRITO_FISICO`  | ENTERO | 14400   | Cuándo abandonar carrito físico (segundos: 4h) |

---

## Agregado: Politica

**Root**: Politica  
**Invariantes**:

- Solo UNA política VIGENTE por tipo
- Versiones numeradas (trazabilidad de cambios)
- Fechas de vigencia (desde/hasta)

---

## Casos de Uso

### CU-CONF-01: Actualizar Parámetro Operativo

**Actor**: Empleado (con permiso CONFIG_SISTEMA)

**Flujo**:

1. Empleado selecciona parámetro y nuevo valor
2. Sistema valida según tipo_dato:
   - ENTERO: número entero válido (tiempos en segundos)
   - DECIMAL: número decimal (porcentajes, ratios)
   - BOOLEAN: "true" o "false" (string, no 1/0)
3. Sistema verifica rango (valor_minimo/valor_maximo)
4. Sistema actualiza valor, registra modificado_por
5. Si requiere_reinicio = true → advertir al empleado
6. Evento: `ParametroOperativoActualizado`

---

### CU-CONF-02: Publicar Nueva Versión de Política

**Actor**: Empleado (con permiso GESTIONAR_POLITICAS)

**Flujo**:

1. Empleado crea nueva versión de política (tipo: CAMBIOS, ENVIOS, TERMINOS)
2. Sistema valida que versión sea única
3. Sistema crea Politica con estado BORRADOR
4. Empleado revisa y publica
5. Sistema:
   - Cambia estado a VIGENTE
   - Marca política anterior como ARCHIVADA
   - Registra fecha_vigencia_desde
6. Evento: `PoliticaPublicada`

---

## Reglas de Negocio

### RN-CONF-01: Validación de Tipo

Cada parámetro valida valor según su tipo_dato.

### RN-CONF-02: Una Política Vigente

Solo una política del mismo tipo puede estar VIGENTE simultáneamente.

---

## Eventos

| Evento                          | Cuándo               | Payload                            |
| ------------------------------- | -------------------- | ---------------------------------- |
| `ParametroOperativoActualizado` | Al cambiar valor     | clave, valor_anterior, valor_nuevo |
| `PoliticaPublicada`             | Al publicar política | politica_id, tipo, version         |

---

## Integraciones

### PROVEE a:

- TODOS LOS MÓDULOS: Parámetros operativos

---

**Referencia**: Ver `CONFIGURACION_ENTITIES_CLAUDE.md`
