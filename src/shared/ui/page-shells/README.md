# Page shells (`@shared/ui/page-shells`)

Esqueletos estándar para pantallas del ERP. Este documento describe el **patrón de wizards de alta** (`WizardPageShell`). La validación inline y el resumen de errores se documentan en `@shared/ui/form/README.md` y en `D:\cowork\boeltech\erp-transport\docs\design-system\form-validation-pattern.md`.

Copia extendida (design system): `D:\cowork\boeltech\erp-transport\docs\design-system\wizard-page-pattern.md`.

---

## Cuándo usar cada shell

| Shell | Uso | Ejemplos |
|-------|-----|----------|
| `WizardPageShell` | Alta por pasos (create) con navegación Siguiente/Anterior y revisión final | `DriverCreatePage`, `CreateVehiclePage`, `BranchCreatePage`, `ClientCreatePage`, `EmployeeFormPage`, `TripFormPage` (create/edit) |
| `FormPageShell` | Edición en una sola vista (sin pasos) | `DriverEditPage`, `EmployeeEditPage`, `ClientEditPage`, `EditVehiclePage` |
| `ListPageShell` | CRUD / registry: búsqueda, filtros, tabla/cards, paginación | Vehículos, clientes, registry de liquidaciones |
| `HubPageShell` | Landing de módulo de config: orientar + readiness? + nav + guía + lanzar (ADR-0091) | `/finance/compensation` |
| `BuilderPageShell` | Construcción no lineal: section nav + canvas + inspector + footer (ADR-0091) | `CompensationSchemeBuilderPage` |
| `WorkbenchPageShell` | Centro operativo: estado → triage por buckets → actuar (ADR-0090) | `SettlementsListPage`, `ApprovalInboxPage` |
| Wizard en diálogo | Flujos acotados dentro de un modal, sin ruta propia | `CatalogImportWizard` |
| Onboarding | Pasos siempre válidos; sin RHF por paso | `OnboardingPage` (excepción documentada) |

**Taxonomía:** CRUD · Hub · Builder · Workbench — checklist y anatomía en
`docs/design-system/patterns.md` (ADR-0090 / ADR-0091).

**Regla:** las `*Page` de features importan el shell desde `@shared/ui/page-shells/...`, no primitivas de `@shared/ui/wizard` (ESLint `no-restricted-imports` en `presentation/pages`).

---

## HubPageShell (resumen)

Anatomía fija: Header → **Readiness?** → Orientation? → Guide? → Nav? → Children → Related config?  
(Actions viven en el header, a la derecha.)

```tsx
import { HubPageShell } from "@shared/ui/page-shells";

<HubPageShell
  title="…"
  description="…"
  readiness={[
    { id: "a", label: "esquemas activos", value: 3, status: "ok", href: "/…" },
  ]}
  readinessAriaLabel="Estado de configuración del módulo"
  orientation={{ text: "…", link: { label: "…", href: "/…" } }}
  nav={[{ id: "a", label: "A", href: "/…" }]}
  activeNavId="a"
  guide={{ title: "…", steps: ["…"], storageKey: "hub-guide" }}
>
  <Outlet />
</HubPageShell>
```

Slots opcionales (compat v1 sin ellos). `readiness` = chips de salud de **configuración** (no confundir con awareness de Workbench).  
Tests: `HubPageShell.test.tsx`.  
ADR-0091 D3/F5 + D3.2 · SDD: `design/sdd/hub-page-shell/`.

---

## BuilderPageShell (resumen)

Anatomía fija: Header (back + título) → banner? → Section nav + Canvas + Inspector → Footer sticky.

```tsx
import { BuilderPageShell } from "@shared/ui/page-shells";

<BuilderPageShell
  title="…"
  description="…"
  backHref="/…"
  sections={sections} // BuilderSection[] con status complete|partial|empty
  activeSectionId={activeId}
  onSectionChange={setActiveId}
  banner={apiError ? <Alert>…</Alert> : null}
  renderCanvas={(id) => /* … */}
  renderInspector={() => /* resumen */}
  footerActions={[{ id: "save", label: "Guardar", onClick }]}
/>
```

Desktop: 3 columnas (nav en panel muted, canvas plano, inspector card). Mobile: tabs + inspector en Sheet.  
Canvas sin card chrome (la feature aporta `FormSectionCard`); el shell muestra el `h2` de la sección activa.  
Tabs: `tablist`/`tab`/`tabpanel` + flechas / Home / End.  
Tests: `BuilderPageShell.test.tsx`. Showcase: `/design-system` → Patrones.  
ADR: `design/adr/0091-…` · SDD: `design/sdd/builder-page-shell/`.

---

## WorkbenchPageShell (resumen)

Anatomía fija: Header → Awareness strip (buckets) → Toolbar → `renderContent()` → Pagination? → Related config?

```tsx
import { WorkbenchPageShell } from "@shared/ui/page-shells";

<WorkbenchPageShell
  title="…"
  buckets={buckets} // WorkbenchBucket[]
  showHeader={!embedded}
  toolbar={{ search, filters, onRefresh }}
  renderContent={() => /* tabla / cola / empty por bucket */}
  relatedConfig={{ label: "…", href: "/…" }}
/>
```

Tests: `WorkbenchPageShell.test.tsx`. Showcase: `/design-system` → Patrones.

---

## Arquitectura del wizard canónico

```
┌─────────────────────────────────────────────────────────────┐
│  *CreatePage (feature)                                       │
│    · WIZARD_STEPS + mapa de campos por paso                  │
│    · formRef + WizardPageShell                               │
│    · mutación / toast solo en éxito o error de API           │
└──────────────────────────┬──────────────────────────────────┘
                           │ formRef
┌──────────────────────────▼──────────────────────────────────┐
│  WizardPageShell                                             │
│    · estado del paso, barra de progreso, navegación          │
│    · valida paso vía formRef.triggerStepValidation           │
│    · submit final vía formRef.requestSubmit                  │
│    · sin toast al fallar Siguiente / click en paso           │
└──────────────────────────┬──────────────────────────────────┘
                           │ renderStep(currentStep)
┌──────────────────────────▼──────────────────────────────────┐
│  *Form (feature)                                             │
│    · RHF + Zod, paneles con aria-hidden                      │
│    · FormValidationSummary tras trigger fallido                │
│    · expone WizardFormRef (useImperativeHandle o hook)       │
└─────────────────────────────────────────────────────────────┘
```

---

## Contrato `WizardFormRef`

Definido en `WizardPageShell.tsx`:

```ts
export interface WizardFormRef {
  triggerStepValidation: (stepIndex: number) => Promise<boolean>;
  requestSubmit: () => void;
}
```

| Método | Responsabilidad |
|--------|-----------------|
| `triggerStepValidation` | `trigger` de los campos del paso (`shouldFocus: true`). Pasos de solo lectura/revisión → `return true`. Opcional: segunda pasada SAT/dominio en el paso que corresponda. |
| `requestSubmit` | Validar pasos previos si aplica y disparar `handleSubmit` de RHF (o lógica equivalente en wizards compuestos). |

### Dos formas de exponer el ref

**A. `useImperativeHandle` en el formulario** (preferido cuando el form es un solo componente):

- `DriverForm`, `VehicleForm`, `BranchForm` — el page pasa `ref={formRef}` al form.

**B. `useWizardFormRef` en la page** (cuando la lógica de validación vive en la page, p. ej. varios sub-formularios):

- `ClientCreatePage`, `TripFormPage` — importar desde `@shared/ui/page-shells/useWizardFormRef` (no desde el barrel `@shared/ui/wizard`).

```ts
const formRef = useRef<WizardFormRef | null>(null);

useWizardFormRef({
  formRef,
  triggerStepValidation: async (stepIndex) => { /* ... */ },
  requestSubmit: () => { /* ... */ },
});
```

`EmployeeFormInner` combina ambos: el form usa `useImperativeHandle` y la page pasa `ref={formRef}` al shell.

---

## Configuración por feature

Co-localizar en la feature (no en `@shared` salvo el shell):

1. **`WIZARD_STEPS`** — array `{ id, title, description }` para `WizardPageShell` (y `WizardSteps`).
2. **Mapa de campos por paso** — p. ej. `DRIVER_CREATE_WIZARD_STEP_FIELDS`, `CLIENT_CREATE_WIZARD_STEP_FIELDS`, `WIZARD_STEP_FIELDS` (viajes en `components/validation.ts`).
3. **Paso de revisión** — último paso sin campos editables; `triggerStepValidation` retorna `true`.

Referencias:

| Módulo | Page | Form / notas |
|--------|------|----------------|
| Conductores | `DriverCreatePage` | `DriverForm` + `DRIVER_CREATE_WIZARD_STEP_FIELDS` |
| Vehículos | `CreateVehiclePage` | `VehicleForm` |
| Sucursales | `BranchCreatePage` | `BranchForm` |
| Clientes | `ClientCreatePage` | `ClientForm` + `ClientAddressForm` (dual ref; SAT en paso domicilio) |
| Empleados | `EmployeeFormPage` | `EmployeeFormInner` + `employeeWizardSteps.ts`; SAT CP31 en paso contacto |
| Viajes | `TripFormPage` | Validadores extra por paso en `validation.ts` |
| Onboarding | `OnboardingPage` | Sin validación por paso (excepción) |

---

## Validación y feedback (matriz)

| Evento | Comportamiento |
|--------|----------------|
| Clic en **Siguiente** o en un paso del stepper | `triggerStepValidation` → si falla: errores inline + `FormValidationSummary` en el form. **Sin toast.** |
| **Confirmar** en paso final | El shell valida pasos `0..n-2`; luego `requestSubmit`. |
| Error de **API** al guardar | Toast destructivo en la page (mutación `onError`). |
| Éxito de **API** | Toast success + navegación al detalle/listado. |

Primitivos: `FieldInlineError`, `FormValidationSummary`, `RHFTextField`, etc. — ver `@shared/ui/form/README.md`.

Tests del shell (sin toast en validación): `WizardPageShell.test.tsx`.

```bash
npm run test -- src/shared/ui/page-shells/WizardPageShell.test.tsx
```

---

## Accesibilidad y copy

- Paneles de pasos no visibles: `aria-hidden={wizardStepIndex !== currentStep}` (o equivalente por paso activo).
- Barra de navegación: etiquetas **Anterior** / **Siguiente** / **Cancelar** con `aria-label` en `WizardNavigationBar`. Con `allowExit={false}` (asistentes obligatorios) se oculta **Cancelar** y el back del header no sale en el primer paso.
- Progreso en wizards modales: `aria-live="polite"` donde aplique (`CatalogImportWizard`).
- `stepsAriaLabel` en `WizardPageShell` cuando el contexto no sea obvio.

---

## Excepciones documentadas

| Caso | Motivo |
|------|--------|
| **Client create** | Dos formularios (`ClientForm` + `ClientAddressForm`); validación SAT en paso de domicilio vía `validateClientAddressFormComplete` / `addressPayloadBridge`. |
| **Trips** | Create y edit usan wizard; validadores adicionales por paso (paradas, carga). |
| **Employees create** | Domicilio personal con SAT en paso de contacto; edit usa `FormPageShell` en `EmployeeEditPage`. |
| **Onboarding** | Pasos informativos; no aplica `WizardFormRef`. |
| **Catalog import** | Wizard en diálogo, no `WizardPageShell`. |

Direcciones SAT: no duplicar reglas del paquete; ADR-0043 y `src/shared/cfdi/addressPayloadBridge.ts`.

---

## Checklist PR (wizard nuevo o refactor)

- [ ] Page usa `WizardPageShell` desde `@shared/ui/page-shells/WizardPageShell` (no `@shared/ui/wizard` en pages).
- [ ] `WIZARD_STEPS` y mapa de campos por paso definidos en la feature.
- [ ] Form expone `WizardFormRef` (`useImperativeHandle` o `useWizardFormRef`).
- [ ] Fallo de paso: `trigger(..., { shouldFocus: true })` + `FormValidationSummary`; **sin toast** en Siguiente.
- [ ] Errores de API solo en mutación (`onError`).
- [ ] Paneles con `aria-hidden`; copy Anterior/Siguiente alineado.
- [ ] Si hay domicilio SAT: segunda pasada vía `addressPayloadBridge` / validadores del paquete.
- [ ] Test de contrato del shell o de `triggerStepValidation` si la lógica es no trivial.

---

## Exports

| Export | Archivo |
|--------|---------|
| `WizardPageShell`, `WizardFormRef` | `WizardPageShell.tsx` |
| `useWizardFormRef` | `useWizardFormRef.ts` |
| Otros shells | `ListPageShell`, `DetailPageShell`, `FormPageShell`, `SettingsPageShell`, `HubPageShell`, `BuilderPageShell`, `WorkbenchPageShell` |

Barrel: `index.ts` (pages pueden importar paths directos al archivo del shell; ambos son válidos en el repo actual).
