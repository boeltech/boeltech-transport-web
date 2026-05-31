# Feature Copy Strategy (ACC)

Patrón de copy mínimo para UI operativa del ERP. Aplica a **cualquier feature** bajo FSD.

## Convención `feature.copy.*`

| Capa | Ubicación | Namespace lógico |
|---|---|---|
| Feature | `src/features/<feature>/presentation/copy/` | `<feature>.copy.<surface>.*` |
| Viajes — detalle | `.../copy/tripDetail/<tab>Copy.ts` | `trips.copy.tripDetail.<tab>.*` |

### Taxonomía por tab/superficie

- `section.*` — títulos de tarjetas y bloques
- `action.*` — verbos de botones y CTAs
- `state.*` — vacíos, loading, solo lectura
- `hint.*` — una línea de contexto (CardDescription, scope)
- `alert.*` — títulos/cuerpos de `DetailAlertCard`
- `error.*` — tooltips disabled / validación UX
- `label.*` — etiquetas de filas (`InfoRow`, KPIs)
- `format.*` — helpers con datos dinámicos (preferir funciones puras)

### Patrón ACC

- **Action:** verbo claro (`Registrar`, `Finalizar`, `Reintentar`)
- **Context:** objeto de dominio (`parada`, `escala`, `viaje`)
- **Consequence:** impacto solo si es crítico

Formato: `Action` · `Action — Context` · `Action — Context. Consequence`

Reglas:

1. Una idea por línea; máx. ~90 caracteres en hints.
2. Sin redundancia entre tabs (cada tab explica su alcance una vez).
3. Errores/disabled con causa concreta.
4. Strings dinámicos → `format.*` o funciones en `alert.*`, no template literals sueltos en JSX.

Helpers compartidos: `formatAccLine()` en `copy/formatAccLine.ts`.

---

## Migración progresiva — detalle de viaje

Fuente de verdad: `tripDetailCopy` en `copy/tripDetail/index.ts`.

| Fase | Tab / superficie | Archivo copy | Cableado UI | Estado |
|---|---|---|---|---|
| 0 | Infra + helper ACC | `copy/*` | — | Hecho |
| 1 | Seguimiento | `trackingCopy.ts` | `TripTrackingTab`, helpers, sheets | Hecho (reubicado) |
| 2 | Operación | `operationCopy.ts` | `TripDetailOperationTab` | Hecho |
| 3 | Ruta | `routeCopy.ts` | `TripDetailRouteTab` | Hecho |
| 4 | Cargas | `cargoCopy.ts` | `TripDetailCargoTab` | Hecho |
| 5 | Costos | `costsCopy.ts` | `TripDetailCostsTab`, hijos | Hecho |
| 6 | Historial + shell | `historyCopy.ts`, `shellCopy.ts` | `TripDetailPage` header/tabs/alertas/historial/KPIs | Hecho |
| 6b | Sub-componentes detalle | `routeCopy`, `cargoCopy`, `costsCopy.financialSummary` | stop cards, sheets, cargo views, resumen financiero | Hecho |

### Copy residual cerrado (detalle)

- **Ruta:** `TripDetailRouteStopCard`, `TripStopOperationalEditSheet`, `tripRouteDetailHelpers`
- **Cargas:** `TripDetailCargoItemCard`, `TripDetailCargoByPickupView`, `tripCargoDetailHelpers`
- **Costos:** `TripWizardFinancialSummary` (compartido wizard/detalle vía `costsCopy.financialSummary`)

Pendiente fuera de detalle: copy residual en sheets de tracking (toasts) y wizard (`BasicInfoStep`, `StopFormSheet`, `CargoStep`, `CargoMovementSheet`).

Módulo financiero compartido wizard/detalle: `presentation/components/trip-financial/`.

### Checklist por fase

1. Extraer strings hardcodeados al módulo `*Copy.ts`.
2. Sustituir en componentes: `tripDetailCopy.<tab>.section.foo`.
3. Eliminar duplicados entre tabs (mover a `shell` si es transversal).
4. Buscar en feature: `rg "title=\"|CardDescription>" presentation/components/trip-`.
5. No duplicar labels de dominio ya en `@features/trips/domain` (p. ej. estados SAT).

### Import recomendado

```ts
import { tripDetailCopy } from "@features/trips/presentation/copy";

const { operation } = tripDetailCopy;
// operation.section.scope
```

Alias legacy (retirar al cerrar fase 1):

```ts
import { trackingCopy } from "./trip-tracking/trackingCopy"; // @deprecated
```

### Próximas superficies (fuera de detalle)

| Superficie | Namespace | Estado |
|---|---|---|
| Wizard alta | `trips.copy.wizard.*` vía `wizardCopy` | Hecho (shell, route, cargo, costs, expense, fiscal, summary) |
| Otros features | replicar `presentation/copy/` | Pendiente |

Copy residual wizard (opcional): `BasicInfoStep`, `StopFormSheet`, `CargoStep`, `CargoMovementSheet`.
