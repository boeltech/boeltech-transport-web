# Location DS family (ADR-0092 / WS-LOCATION)

Patrón UX transversal **BUSCAR → ENCONTRAR → CONFIRMAR → USAR** sobre el master `addresses` (sin tabla `locations` en v1).

## Componentes

| Pieza | Rol |
|-------|-----|
| `LocationField` | Orquestador: vacío → Picker; con valor → Card; Editar → Sheet |
| `LocationPicker` | Popover + Command; fusión catálogo + Mapbox |
| `LocationCard` | Post-confirmación (`compact` \| `default` \| `detailed` \| `operational`) |
| `LocationSheet` | Confirmación: nombre → calle/núm/CP → pin en el mapa (`confirmationMode`) |
| `LocationStatus` | Badge de `geocodingAccuracy` (+ Carta Porte opcional) |
| `useLocationSearch` | React Query interno + Mapbox en paralelo (`bias_from_query`, `query_meta`) |
| `composeLocationSearchResults` | Orden D3 (puro); eleva Crear si `searchConfidence=low` |
| `locationValueToSatAddressFields` | Prefill SAT/geo hacia formularios (F4+) |

## Contextos (`LocationContext`)

`fiscal` · `operational` · `tripStop` · `geoPoint` — ver matriz de completitud en el SDD.

## Cableado Capa 3 (F3–F5)

| Feature | Superficie |
|---------|------------|
| Viajes | `StopFormSheetAddressOriginSection`, `TripRouteSlotCapture`, swap fiscal |
| Clientes | `ClientAddressForm` |
| Sucursales | `BranchForm` |
| Directorio | `TenantLocationMasterDetail` → `ClientAddressForm` (`ownerTypes=tenant`) |
| Fiscal empresa | `CompanyFiscalAddressSheet` |

`AddressInput` se conserva debajo del campo Location para detalle SAT — en superficies cableadas va bajo el bloque «Afinar domicilio» (`LOCATION_FIELD_COPY.satDetailTitle`).

## Relacionados

- Resolver Mapbox→SAT: `@shared/geolocation/addressResolver`
- Anti-duplicados (warning): `@shared/location/detectPossibleDuplicates`
- Precarga existente: `@shared/ui/address-picker` (`AddressPicker` se conserva)
- Guía usuario: `D:\cowork\boeltech\erp-transport\docs\direcciones\patron-location-usuario.md`
- Addendum calidad búsqueda (pegado Google): `design/adr/0092-addendum-calidad-busqueda-location-pegado.md`
- Smoke: `npm run test:smoke:location-field`

## Uso mínimo

```tsx
import { LocationField, type LocationValue } from "@shared/ui/location";

<LocationField
  context="tripStop"
  clientId={clientId}
  value={location}
  onChange={setLocation}
/>
```
