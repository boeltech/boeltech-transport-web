# AddressInput

Componente compartido para captura de direcciones SAT-first en el ERP Transporte.

## Objetivo

Centralizar la captura de direcciones en una sola UI reutilizable, con cascadas
de catálogos SAT y validación al guardar vía `@boeltech/cfdi-domain` (`addressPayloadBridge`).

## Variantes y contexto

| Eje | Valores | Responsabilidad |
|-----|---------|-----------------|
| **`variant`** | `carta-porte` \| `personal` | UX en vivo: asteriscos XSD CP31, recomendación de municipio, `onCartaPorteReadyChange` (solo `carta-porte` exige lookup de CP para readiness). |
| **`formContext`** | `billingOnCreate`, `additional`, `companyFiscal`, `employeePersonal`, `tripStop`, … | Perfil de negocio: calle opcional, `location_name`, coordenadas (`trip_stop`). |

**SAT al guardar:** siempre XSD Domicilio CP31 (`carta_porte_31`) en el paquete; `context` en el bridge define reglas operativas adicionales.

SoT obligatoriedad XSD: `src/shared/validation/cp31DomicilioUx.ts` + `@boeltech/cfdi-domain/reglas/cp31-domicilio-xsd.ts`.

## Ubicación

- `AddressInput.tsx`
- `AddressInput.types.ts`
- `AddressPreview.tsx`
- `use-postal-code-lookup.ts`
- `use-sat-catalogs.ts`
- `index.ts`

## Reglas de cascada

1. **CP (5 dígitos)**
   - Dispara lookup `GET /catalogs/sat/by-postal-code/:cp`.
   - Autocompleta estado y municipio cuando hay match.
   - Carga localidad/colonia candidatas.
2. **Colonia**
   - Prioridad 1: colonias del lookup por CP.
   - Prioridad 2: catálogo `sat_colonia` por `parent_code=postalCode`.
   - Prioridad 3: captura manual (`neighborhoodName`) si no hay opciones SAT.
3. **Cambio de estado**
   - Limpia municipio, localidad y colonia para evitar inconsistencias.
4. **Cambio de CP**
   - Limpia colonia/localidad previas y reprocesa cascada.

## Contrato de props (resumen)

- `variant`: `carta-porte` | `personal` (requerido)
- `formContext`: perfil UX alineado a `ADDRESS_FORM_PARSE_PROFILES`
- `control`: control de `react-hook-form`
- `namePrefix`: prefijo de campos anidados (`address`, `fiscalAddress`, etc.)
- `savedAddresses`: lista opcional para prefilling
- `onSelectSaved`: callback al seleccionar dirección guardada
- `onCartaPorteReadyChange`: callback de readiness (solo `carta-porte`)
- `showLatLng`, `showPrimaryToggle`, `layout`, `collapsible`

## Accesibilidad

- Campos con `Label` + `htmlFor`.
- `aria-invalid` y `aria-describedby` en errores.
- Orden de tab natural según flujo de captura.

## Pruebas asociadas

- `src/shared/validation/cp31DomicilioUx.test.ts`
- `src/shared/validation/addressFormUx.test.ts`
- Schemas por feature: `clientAddressSchema`, `companyFiscalAddressSchema`, `employeePersonalAddressSchema`
- `src/shared/ui/address-input/AddressInput.test.tsx`

## Estado actual

Integrado en formularios productivos:

- `ClientAddressForm` (`variant="carta-porte"`)
- `CompanySettingsForm` (`variant="carta-porte"`)
- `EmployeeFormInner` (`variant="personal"`)
- `StopFormDialog` (`variant="carta-porte"`)

Errores: `FieldInlineError` + `error` en controles + `getFieldErrorAriaProps`.
SAT al guardar: `@shared/cfdi/addressPayloadBridge` (sin duplicar reglas en Zod local).

## EntityAddressForm

- `AddressFormNotice.tsx` + `addressFormNoticeRules.ts`
- Copy: `addressFormCopy.ts`
- Props: `formContext`, `addressVariant`, secciones pre/post `AddressInput`

### Mensajes en `AddressInput` (2026-05)

- **Banners:** solo lookup en vuelo (error de consulta, cargando) y, si aplica, CP con varias colonias/localidades.
- **Obligatoriedad:** asteriscos en label + `FieldInlineError` (Zod/paquete en el formulario padre); sin banners de validación duplicados.
- **Banner global (`AddressFormNotice`):** copy de contexto (`addressFormCopy`); no repite errores de municipio/CP/estado.
