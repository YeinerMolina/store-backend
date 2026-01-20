# Módulo LOGÍSTICA

**Contexto**: LOGISTICA  
**Responsabilidad**: Gestión de envíos externos  
**Archivo de Entidades**: `LOGISTICA_ENTITIES_CLAUDE.md`

---

## Visión

Este módulo gestiona los envíos con proveedores externos cuando la modalidad_entrega es ENTREGA_EXTERNA.

---

## Responsabilidades

1. Crear envíos vinculados a ventas
2. Actualizar estado del envío (tracking)
3. Integración con API de proveedores de envío

---

## Agregado: Envio

**Root**: Envio  
**Entidades**: Ninguna (atómico)

**Invariantes**:

- Un envío está vinculado a UNA venta única
- Requiere proveedor de servicios tipo ENVIO
- Estado sigue ciclo: CREADO → DESPACHADO → EN_TRANSITO → ENTREGADO

---

## Casos de Uso

### CU-LOG-01: Crear Envío

**Actor**: Sistema (desde COMERCIAL al confirmar venta)

**Precondiciones**:

- Venta en estado CONFIRMADA
- modalidad_entrega = ENTREGA_EXTERNA

**Flujo**:

1. Sistema selecciona proveedor de servicios (tipo ENVIO)
2. Sistema crea Envio con:
   - venta_id
   - proveedor_servicios_id
   - direccion_destino (snapshot JSON)
   - costo_envio
   - estado = CREADO
3. Sistema integra con API del proveedor → obtiene numero_guia
4. Sistema actualiza numero_guia y url_seguimiento
5. Evento: `EnvioCreado`

---

### CU-LOG-02: Actualizar Estado de Envío

**Actor**: Sistema (webhook desde proveedor o consulta periódica)

**Flujo**:

1. Proveedor notifica cambio de estado
2. Sistema actualiza estado del envío
3. Si estado = ENTREGADO:
   - Actualizar fecha_entrega_proveedor
   - COMERCIAL actualiza venta a ENTREGADA
   - Evento: `EnvioEntregado`

---

## Eventos

| Evento               | Cuándo               | Payload                         |
| -------------------- | -------------------- | ------------------------------- |
| `EnvioCreado`        | Al crear envío       | envio_id, venta_id, numero_guia |
| `EnvioDespachado`    | Al despachar         | envio_id, fecha                 |
| `EnvioEnTransito`    | En tránsito          | envio_id                        |
| `EnvioEntregado`     | Entrega exitosa      | envio_id, fecha                 |
| `EnvioConIncidencia` | Incidencia reportada | envio_id, descripcion           |

---

## Integraciones

### CONSUME de:

- COMERCIAL: Venta (para crear envío)
- IDENTIDAD: ProveedorServicios (para API)

---

**Referencia**: Ver `LOGISTICA_ENTITIES_CLAUDE.md`
