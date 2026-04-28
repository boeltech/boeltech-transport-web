# AddressInput (Fase 1)

Componente compartido para captura de direcciones SAT-first en el ERP Transporte.

## Objetivo

Centralizar la captura de direcciones en una sola UI reutilizable, con cascadas
de catalogos SAT y validacion consistente con `addressSchema`.

## Ubicacion

- `AddressInput.tsx`
- `AddressInput.types.ts`
- `AddressPreview.tsx`
- `use-postal-code-lookup.ts`
- `use-sat-catalogs.ts`
- `index.ts`

## Modos soportados

- `basic`: captura general sin restricciones adicionales de Carta Porte.
- `personal`: variante relajada para direccion personal.
- `cfdi`: enfocado a direccion fiscal CFDI.
- `carta-porte`: activa validacion visual de readiness para Carta Porte.

### Regla de bloque operativo por modo

El bloque de datos operativos de direccion (contacto, telefono, email, horario,
notas, instrucciones) **no es universal**. Su visibilidad debe responder al
escenario:

- `carta-porte`: mostrar bloque completo (aplica para direccion operativa).
- `cfdi`: mostrar bloque opcional (preferible colapsado por defecto).
- `personal` y `basic`: ocultar bloque para evitar ruido de captura.

> Esta regla ya esta aplicada en el demo de `/dev/address-input`.

## Reglas de cascada

1. **CP (5 digitos)**
   - Dispara lookup `GET /catalogs/sat/by-postal-code/:cp`.
   - Autocompleta estado y municipio cuando hay match.
   - Carga localidad/colonia candidatas.
2. **Colonia**
   - Prioridad 1: colonias del lookup por CP.
   - Prioridad 2: catalogo `sat_colonia` por `parent_code=postalCode`.
   - Prioridad 3: captura manual (`neighborhoodName`) si no hay opciones SAT.
3. **Cambio de estado**
   - Limpia municipio, localidad y colonia para evitar inconsistencias.
4. **Cambio de CP**
   - Limpia colonia/localidad previas y reprocesa cascada.

## Contrato de props (resumen)

- `mode`: `basic | personal | cfdi | carta-porte`
- `control`: control de `react-hook-form`
- `namePrefix`: prefijo de campos anidados (`address`, `fiscalAddress`, etc.)
- `savedAddresses`: lista opcional para prefilling
- `onSelectSaved`: callback al seleccionar direccion guardada
- `onCartaPorteReadyChange`: callback de readiness
- `showLatLng`, `showPrimaryToggle`, `layout`, `collapsible`

## Accesibilidad

- Campos con `Label` + `htmlFor`.
- `aria-invalid` y `aria-describedby` en errores.
- Orden de tab natural segun flujo de captura.

## Pruebas asociadas

- `src/shared/validation/addressSchema.test.ts`
- `src/shared/ui/address-input/AddressInput.test.tsx`

## Estado actual

Este componente representa la **fundacion de Fase 1**.
La integracion en formularios productivos (`clients`, `employees`, `settings`,
`trips`) queda para fases posteriores.

## Demo de referencia

- Ruta: `/dev/address-input`
- Incluye escenarios por pestañas:
  - Cliente/Paradas (`carta-porte`)
  - Solo CFDI (`cfdi`)
  - Personal/Basico (`personal`)
- Incluye panel lateral para validar cascada SAT en tiempo real
  (CP, estado, municipio, colonia SAT/manual).
