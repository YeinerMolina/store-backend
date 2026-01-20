# Módulo FISCAL

**Contexto**: FISCAL  
**Responsabilidad**: Documentación legal y cumplimiento tributario  
**Archivo de Entidades**: `FISCAL_ENTITIES_CLAUDE.md`

---

## Visión

Genera y gestiona documentos fiscales (facturas, notas de crédito/débito) para cumplimiento legal con la DIAN (Colombia).

---

## Responsabilidades

1. Generar facturas para ventas confirmadas
2. Generar notas de ajuste para cambios con diferencia de precio
3. Garantizar inmutabilidad de documentos (requisito legal)
4. Envío a DIAN (fuera del alcance inicial, preparado para integración)

---

## Agregados

### Agregado: DocumentoFiscal

**Root**: DocumentoFiscal  
**Invariantes**:

- **INMUTABLE**: Una vez creado, NUNCA se modifica ni elimina (INSERT-only)
- Hash de integridad para validar contenido
- Una factura por venta

---

### Agregado: NotaAjuste

**Root**: NotaAjuste  
**Invariantes**:

- **INMUTABLE**: INSERT-only
- Vinculada a DocumentoFiscal original y Cambio
- Tipo: NOTA_CREDITO (reembolso) o NOTA_DEBITO (cargo adicional)

---

## Casos de Uso

### CU-FIS-01: Generar Factura

**Actor**: Sistema (desde COMERCIAL al confirmar venta)

**Flujo**:

1. Venta pasa a estado CONFIRMADA
2. Sistema genera DocumentoFiscal:
   - numero_documento (consecutivo legal)
   - tipo = FACTURA
   - venta_id
   - cliente_id (info tributaria)
   - subtotal, impuestos (JSON), total
   - contenido_completo (JSON con representación completa)
   - hash_integridad (SHA-256 del contenido)
   - estado_dian = PENDIENTE
3. Evento: `FacturaGenerada`

---

### CU-FIS-02: Generar Nota de Ajuste

**Actor**: Sistema (desde COMERCIAL al ejecutar cambio)

**Flujo**:

1. Cambio ejecutado con diferencia de precio
2. Sistema determina tipo:
   - diferencia > 0 → NOTA_DEBITO (cliente debe pagar)
   - diferencia < 0 → NOTA_CREDITO (tienda reembolsa)
3. Sistema crea NotaAjuste vinculada a DocumentoFiscal original y Cambio
4. Evento: `NotaAjusteGenerada`

---

## Reglas de Negocio

### RN-FIS-01: Inmutabilidad

Documentos fiscales y notas NUNCA se modifican ni eliminan (requisito legal).

### RN-FIS-02: Hash de Integridad

Se calcula SHA-256 del contenido_completo para validar integridad.

### RN-FIS-03: Consecutivo Legal

El numero_documento debe seguir consecutivo legal autorizado por DIAN.

---

## Eventos

| Evento               | Cuándo           | Payload                         |
| -------------------- | ---------------- | ------------------------------- |
| `FacturaGenerada`    | Al crear factura | documento_id, venta_id, total   |
| `NotaAjusteGenerada` | Al crear nota    | nota_id, tipo, cambio_id, monto |

---

## Integraciones

### CONSUME de:

- COMERCIAL: Venta y Cambio
- IDENTIDAD: Cliente (info tributaria)

---

**Referencia**: Ver `FISCAL_ENTITIES_CLAUDE.md`
