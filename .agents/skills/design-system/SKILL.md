---
name: design-system
description: Design system del ERP-T. App shell (sidebar, header, navegación, toast), tokens OKLCH, tipografía, page shells, componentes base y patrones de layout. Usar al crear o revisar chrome global, pantallas, componentes o cambios visuales del frontend.
---

# Design System — boeltech-transport-web

## Cuándo aplicar

- Crear una pantalla nueva o componente UI
- Modificar sidebar, header, navegación global o providers del layout
- Elegir qué shell de página usar
- Decidir toast vs alert vs badge en sidebar vs notificaciones del header
- Usar un badge / button / alert y no saber la variante correcta
- Revisar si un color, spacing o tipografía sigue las convenciones
- Agregar un token nuevo al sistema
- Trabajar la landing pública `/welcome` (superficie **Patio Marketing** — ver sección homónima)

Fuente en vivo: ruta `/design-system` dentro de la app (light/dark). Landing: `/welcome`.

### Evolución del DS (fábrica)

El día a día es **Conform**: features usan las piezas de este skill; no inventan tipografía,
color ni shells locales. Craft Operate (`impeccable`) mejora densidad/estados *dentro* de
esas piezas.

Para **cambiar el sistema** (tokens, shells, primitivos, empty/hub patterns):

1. Capacidad `ux-ui-mejoras` modo **`propose-ds`** → RFC (skills de diseño pueden proponer).
2. CEO aprueba **`ds_evolution`** en el pedido (Evolve por pedido puntual).
3. Modo **`evolve-ds`** aterriza aquí + `src/app/styles/index.css` / `@shared/ui` + demo
   `/design-system` + docs cowork — **antes** de adoptar en pantallas.
4. Pantallas vuelven a Conform con el DS ya actualizado.

Sin `ds_evolution.approved` → no mutar tipografía/paleta/shells del sistema desde un pedido
de feature. Cloud Agents solo ven este skill versionado; las skills taste/impeccable locales
no sustituyen este SoT.

---

## App Shell — chrome global

Marco fijo alrededor del `<Outlet />`. **No confundir** con page shells (capa interior).

```
AppLayout (providers) → LayoutShell → Sidebar + Header + main → Outlet → PageShell → Feature
```

| Pieza | Ruta | Notas |
|---|---|---|
| Providers | `src/widgets/layout/ui/AppLayout.tsx` | Query → Auth → Permission → Theme → Toast → Sidebar → LayoutShell |
| Layout | `src/widgets/layout/ui/LayoutShell.tsx` | Sidebar **240/56px**, header **h-14** solid, skip link → `#contenido`, main `pt-16` + `max-w-7xl`. Un solo landmark `<aside>` (desktop). |
| Sidebar | `src/widgets/sidebar/` | `navigation.ts` + RBAC via `useNavigation`; badges via `useNavigationWithBadges`. Active: `bg-sidebar-accent` + `text-sidebar-foreground` (neutro) + riel **3px** `bg-sidebar-primary` (ámbar; primary solo en riel) + `aria-current="page"`. Badge visible en colapsado (número o dot). Labels de grupo sentence-case (`text-sidebar-foreground/60`). Sin user/logout en footer (solo collapse). |
| Header | `src/widgets/header/ui/Header.tsx` | Solid `bg-background` (sin glass/blur). Search ⌘K `bg-muted` + `border-border` (Operate cool; sin warm wash). **lupa móvil** `<md` abre el mismo menú. Campana inbox, tema, menú usuario (logout aquí; nombre/rol `lg+`). |
| Estado sidebar | `src/app/providers/SidebarProvider.tsx` | Colapso persistido en localStorage |
| Anchos | `sidebarLayout.ts` | `SIDEBAR_WIDTH_PX=240` / `SIDEBAR_COLLAPSED_WIDTH_PX=56` — alinear Header left + main margin |

**Tokens sidebar:** `bg-sidebar`, `text-sidebar-foreground`, `bg-sidebar-primary` (ámbar en v2 Patio), `bg-sidebar-accent`, `border-sidebar-border` — ver `tokens.md`. No usar `--background` ni `bg-primary/10` en el ítem activo.

**Superficies:** light `--background` off-white (hue 250) vs `--card` blanco puro. `Card` default: `rounded-xl border shadow-sm`.

**Al agregar ruta al menú:** ítem en `navigation.ts` (con `module`/`roles`) + ruta en `routes.tsx`. Badge dinámico → `enrichNavigationWithBadges`, no hardcode en JSX.

**Header — reglas:**
- Izquierda: menú móvil + search (desktop) / lupa (móvil) → command palette (misma nav filtrada que sidebar).
- Derecha: notificaciones, ciclo de tema (system → light → dark), menú usuario.
- Solid (sin `backdrop-blur` / glass).
- **No** poner títulos de página (`text-2xl`) en el header global — van en el page shell.
- **No** duplicar bloque de usuario en el sidebar.

**Toast vs Alert vs notificaciones:**

| Mecanismo | Cuándo |
|---|---|
| `toastSuccess/Error/…` | Feedback efímero post-mutación o error API |
| `Alert` | Mensaje persistente en pantalla |
| Badge en ítem sidebar | Contador operativo (p. ej. aprobaciones) |
| Campana header | Inbox in-app cross-módulo | `useUnreadNotificationsCount`, `/notifications` |

`ToastProvider`: `top-right`, no montar otro `Toaster` en features.

Demo viva: `/design-system` → App Shell. Doc: `docs/design-system/app-shell.md`.

---

## Overlays: Sheet, Dialog y Toast

Radix Dialog (base de Sheet) y Sonner no se coordinan solos. La solución vive en el **primitivo** [`sheet.tsx`](../../../src/shared/ui/sheet/sheet.tsx), no en features.

### Sheet — dos capas obligatorias

| Capa | Qué | Por qué |
|------|-----|---------|
| 1 | `modal={false}` en `Sheet` (default) | Con `modal={true}`, `inert` bloquea clics en toasts portaleados a `body` |
| 2 | `SheetBackdrop` + `useBodyScrollLock` | Con `modal={false}`, Radix no oscurece ni bloquea scroll del body |
| 3 | `onInteractOutside` + `onPointerDownOutside` en `SheetContent` | Con `modal={false}`, Radix cierra el sheet en outside click; el toast cuenta como "fuera" |

Contrato Sonner: [`sonnerDismissGuard.ts`](../../../src/shared/ui/toast/sonnerDismissGuard.ts). **No duplicar** dismiss guard en `*Sheet.tsx` de features.

**Excepción:** `modal={true}` solo si no habrá toasts ni portales externos con el sheet abierto (documentar en PR).

### Dialog

- Mantener `modal={true}` (confirmaciones, trap de foco).
- Errores API con dialog abierto → **`Alert` inline** en `DialogContent`; no depender de toast interactivo.
- Éxito → toast tras cerrar el dialog.

### Toast vs Alert en mutaciones desde overlay

| Escenario | Patrón |
|-----------|--------|
| Éxito post-mutación | Toast; cerrar overlay |
| Error corto (≤ ~160 chars) | Toast (sheet) o Alert (dialog) |
| Error largo (PAC/SAT) | Alert inline seleccionable + toast breve (`useOverlayMutationFeedback`) |
| Validación RHF | `FormValidationSummary` / `FieldInlineError`; sin toast |
| Clic en toast con sheet abierto | Sheet permanece abierto (guard en primitivo) |

### z-index

Sheet `z-50` · Toaster `z-100` (ver `Toaster.tsx`).

Doc: [`src/shared/ui/toast/README.md`](../../../src/shared/ui/toast/README.md) · demo: `/design-system` → Overlays.

---

## Formularios: campos monetarios

- Primitivo: [`MoneyInput.tsx`](../../../src/shared/ui/form/MoneyInput.tsx) / `RHFMoneyField` — badge ISO (`MXN`) + cantidad sin `$` duplicado en blur.
- **Sheet o dialog** (ancho `sm:max-w-2xl` o menor): agrupar importes en `grid-cols-1 sm:grid-cols-2`.
- **Página ancha** (`FormPageShell`, `max-w-7xl`): `grid-cols-2 sm:grid-cols-4` es válido.

---

## Formularios largos (edit) — sticky + section rail + unsaved

Enmiendas DS **D5 / D6 / D11** (pedido `vehiculos-form-crud-ds`). Aplican a edición
padre en `FormPageShell` con muchas secciones (flota, maestros densos). **No**
sustituyen `WizardPageShell` (alta por pasos) ni `BuilderPageShell` (nav no lineal
+ inspector).

| Primitivo | Path | Rol |
|---|---|---|
| `FormStickyActions` | `@shared/ui/form` | Pie sticky Cancelar / Guardar (visible sin scroll al fondo en desktop) |
| `LongFormSectionNav` | `@shared/ui/form` | Rail de secciones; badge destructivo si hay errores en esa sección |
| `LongFormEditLayout` | `@shared/ui/form` | Grid `lg:grid-cols-[280px_1fr]` (rail + canvas) |
| `useUnsavedChangesGuard` | `@shared/hooks` | Bloquea navegación data-router + `beforeunload` si dirty |
| `UnsavedChangesDialog` | `@shared/ui/form` | Confirmación al salir; copy en `UNSAVED_CHANGES_COPY` |

```tsx
import { useUnsavedChangesGuard } from "@shared/hooks";
import {
  FormStickyActions,
  LongFormEditLayout,
  LongFormSectionNav,
  UnsavedChangesDialog,
} from "@shared/ui/form";

const [isDirty, setIsDirty] = useState(false);
const { blocker, allowLeave, resetAllowLeave } = useUnsavedChangesGuard({ isDirty });

// En submit válido: allowLeave() antes de mutate.
// Si la mutación falla (isPending → false): resetAllowLeave().

<form className="space-y-6" onSubmit={…}>
  <LongFormEditLayout
    nav={
      <LongFormSectionNav
        sections={sections} // { id, label, icon }[]
        activeSectionId={activeId}
        errorCountBySection={errorCounts}
        onSelectSection={(id) => {
          setActiveId(id);
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />
    }
  >
    <div id="section-a" className="scroll-mt-28">…</div>
    <div id="section-b" className="scroll-mt-28">…</div>
  </LongFormEditLayout>

  <FormStickyActions sticky>
    <Button type="button" variant="outline">Cancelar</Button>
    <Button type="submit" disabled={!isDirty}>Guardar</Button>
  </FormStickyActions>
</form>
<UnsavedChangesDialog blocker={blocker} />
```

**Reglas:**

- Edit largo = `FormPageShell` + estos primitivos; **no** Sheet para el padre.
- Cada sección ancla con `id` estable + `scroll-mt-*` (compensa header).
- `errorCountBySection` lo calcula la feature (mapa campo→sección); el rail solo pinta.
- `FormStickyActions sticky={false}` si el form es corto (mismo chrome de fila, sin sticky).
- Guardar **disabled** si `!isDirty`; con dirty, Cancelar / back / link disparan el diálogo.
- `useUnsavedChangesGuard` **exige data router** (`createBrowserRouter` / `createMemoryRouter`). En tests de página usar `createMemoryRouter`, no `MemoryRouter`.
- Tras submit OK: `allowLeave()` y luego `navigate`. Tras error de mutación: `resetAllowLeave()`.
- Primera instancia canónica: **vehicles** (`EditVehiclePage` + wizard create dirty).
- Branch edit ya usa `FormStickyActions`. Employee usa adapters finos sobre `LongFormSectionNav` / `LongFormEditLayout`.
- Demo viva: `/design-system` → **Form largo**.

Tests: `FormStickyActions.test.tsx`, `LongFormSectionNav.test.tsx`,
`useUnsavedChangesGuard.test.tsx`, `UnsavedChangesDialog.test.tsx`.
README: `src/shared/ui/form/README.md` · `src/shared/ui/page-shells/README.md`.

---

## Tokens de color — sistema OKLCH

Todos en `src/app/styles/index.css`. Tailwind los expone como utilidades vía `@theme inline`.

### Paletas conmutables (light/dark × v1/v2)

Independiente del modo light/dark. Atributo `data-palette` en `<html>`, persistido en
`localStorage` (`boeltech-palette`). API: `useTheme().colorPalette` /
`setColorPalette` / `PaletteSegmented` en `/design-system`.

| Id | Nombre | Default producto | Idea |
|---|---|---|---|
| `v1` | Azul-tinta | Alternativa (`/design-system`) | Primary hue 250; sidebar claro (light) |
| `v2` | Patio (ink + ámbar + brand) | **Sí** (`COLOR_PALETTE_DEFAULT`) | Triad Operate: ink estructura; ámbar señala (no CTA); brand Teal Operate = `--primary` (hue 205) |

v2 anclas (fuente de verdad; no utilidades Tailwind aún): `--palette-ink`,
`--palette-amber`, `--palette-brand` (Teal Operate ≈ `#008292` /
`oklch(0.54 0.13 205)` light · L~0.72 dark), `--palette-concrete`, `--palette-elevated`,
`--palette-muted`, más derivados `--palette-amber-soft`, `--palette-ink-raised`,
`--palette-hairline`. Neutros en hue 256. Chrome activo = `sidebar-primary`
(ámbar). CTAs = `--primary` → brand (nunca ámbar).

**Brand primario (Teal Operate en v2):**

| Utilidad Tailwind | Token | Uso típico |
|---|---|---|
| `bg-primary-50` / `text-primary-50` | `--primary-50` | Fondos sutiles |
| `bg-primary-100` | `--primary-100` | Backgrounds de chips info |
| `bg-primary` | `--primary` (= `primary-600` light / `primary-500` dark) | CTA principal |
| `bg-primary-700` | `--primary-700` | Hover/pressed del primary |

**Semánticos solid** (para CTAs, badges de atención, alerts fuertes):

`--success` `--warning` `--info` `--destructive` `--neutral`

En v2, `--info` comparte familia hue 205 con brand pero un escalón menos chroma
(no idéntico al CTA; sin azul cielo aparte). Utilidades: `bg-success`,
`text-warning-foreground`, etc.

**Semánticos soft** (para chips de estado en listas, backgrounds de mensajes):

`--success-soft` / `--success-soft-foreground`, `--warning-soft` / `--warning-soft-foreground`, ...

Utilidades: `bg-success-soft`, `text-success-soft-foreground`, etc.

**Charts (v2 familia Patio):** `--chart-1` brand · `--chart-2` slate ink ·
`--chart-3` ámbar · `--chart-4` ink muted · `--chart-5` success. Usar en
gráficas del dashboard y módulo de finanzas.

**Surfaces clave:**

| Token | Uso |
|---|---|
| `--background` / `--foreground` | Fondo y texto de la app |
| `--card` / `--card-foreground` | Cards y panels |
| `--muted` / `--muted-foreground` | Backgrounds discretos / texto descriptivo |
| `--accent` / `--accent-foreground` | Lavado cool ink/concrete (ghost/outline hover). En v2 **no** es ámbar |
| `--border` | Bordes de cards |
| `--input` | Bordes de form inputs |
| `--ring` | Focus ring |

**Regla:** nunca `bg-red-500`, `bg-green-100`, etc. Si necesitas un nuevo color, primero agrega el token en v1 (`:root` / `.dark`) y el override v2 si aplica, luego mapéalo en `@theme inline`. Contraste AA: `contrastPairs.test.ts` (v1 + v2).

---

## Tipografía

| Token | Fuente | Uso |
|---|---|---|
| `--font-sans` | Inter Variable | UI general, headings, body |
| `--font-mono` | JetBrains Mono Variable | RFC, UUID, totales, claves SAT |

`font-mono` se aplica con la clase `font-mono` de Tailwind. Las tablas usan `tabular-nums` por defecto para alineación de números.

**Escala tipográfica por rol:**

| Rol | Tailwind | Peso | Dónde aparece |
|---|---|---|---|
| Page title (h1) | `text-2xl` | `font-bold` | Header de cada shell |
| Section title (h2) | `text-lg` | `font-semibold` | `FormSectionCard`, tabs |
| Card title (h3) | `text-base` | `font-semibold` | `CardTitle` |
| Body | `text-sm` | `font-normal` | Contenido general |
| Caption / metadata | `text-xs` | `font-medium` | Labels, fechas, IDs |
| Datos tabulares | `text-sm font-mono` | — | RFC, UUID, totales |

---

## Border radius y spacing

| Token | Valor | Uso |
|---|---|---|
| `rounded-sm` | 6px | Inputs pequeños |
| `rounded-md` | 8px | Botones, badges |
| `rounded-lg` | 10px | Cards, dialogs (default) |
| `rounded-xl` | 14px | Hero cards |

**Spacing por contexto:**

| Contexto | Spacing |
|---|---|
| Page (entre header / toolbar / content) | `space-y-6` |
| Card content | `space-y-4` |
| Form (entre Label e Input) | `space-y-1.5` |
| Form (entre fields) | `space-y-4` |
| Inline (grupos de botones / badges) | `gap-2` o `gap-3` |

---

## Shells de página

`src/shared/ui/page-shells/` — usar SIEMPRE para nuevas páginas.

| Shell | Cuándo usar | Ejemplo real |
|---|---|---|
| `ListPageShell` | CRUD / registry: búsqueda, filtros, paginación | `VehicleListPage`, `SettlementsRegistryPage`, **`/notifications`** (Ola 2 #3 inbox) |
| `DetailPageShell` | Detalle de entidad con tabs y KPIs; header canónico = patrón **Detail header** en `docs/design-system/patterns.md` | `InvoiceDetailPage`, `ClientDetailPage` |
| `FormPageShell` | Edición simple (un formulario, sin pasos) | `EditVehiclePage`, `EmployeeFormPage` |
| `WizardPageShell` | Creación/edición por pasos con validación incremental | `TripFormPage` |
| `HubPageShell` | Landing de módulo: orientar + readiness? + nav + guía + lanzar (ADR-0091) | `/finance/compensation`, **`/finance/analysis`** (Ola 3 #5) |
| `BuilderPageShell` | Construcción no lineal: section nav + canvas + inspector (ADR-0091) | `CompensationSchemeBuilderPage` |
| `WorkbenchPageShell` | Centro operativo: triage por buckets (ADR-0090) | `SettlementsListPage`, **`/finance/approvals`** (Ola 2 #2), **`/trips`** (Ola 2 #1), **`/finance/invoices`** (Ola 3 #1), **`/finance/cobros`** (Ola 3 #2) |
| `SettingsPageShell` | Configuración con sidebar de secciones | `GeneralSettingsPage` |

**Maestros cortos vs largos:** catálogo corto (pocos campos, sin ficha) → `ListPageShell` + Sheet (`TrailerCatalogSheet`); maestro denso con secciones → `FormPageShell` (+ sticky/rail si aplica; vehicles/drivers/clients/branches). No inventar Detail/FormPageShell para el corto.

**Nunca** importar primitivas de layout sueltas directamente en una página — usar siempre el shell correspondiente.

### Taxonomía rápida (CRUD · Hub · Builder · Workbench)

| Job | Shell |
|-----|-------|
| Buscar / CRUD entidad | `ListPageShell` |
| Orientar módulo / lanzar listados o Builder | `HubPageShell` |
| Construir objeto complejo (navegación no lineal) | `BuilderPageShell` |
| Entender estado → priorizar → actuar | `WorkbenchPageShell` |

**Hub** — usar si **≥ 3 de 5**: (1) módulo de config con sub-áreas, (2) orientación / puente operativo, (3) acción = lanzar no triage, (4) tabs de sub-módulo (no buckets), (5) no es Builder. Slots: `orientation`, `nav`, `guide`, `readiness`, actions (opcionales).

**Workbench** — usar si **≥ 4 de 7**: (1) job = estado no búsqueda, (2) buckets/etapas, (3) acción primaria = procesar cola, (4) KPIs de triage above-the-fold, (5) bulk/inline en la misma superficie, (6) content cambia por bucket, (7) registry histórico secundario.

Anatomía Workbench: Header → Awareness strip → Toolbar → `renderContent()` → Pagination? → Related config?  
Empty/error **por bucket** en la feature. No ampliar `ListPageShell` ni fusionar Hub con Workbench.

**No confundir:** Hub `readiness` = chips de salud de **configuración** (no filtran children). Workbench awareness = buckets de **cola operativa** (sí filtran).

**Viajes (Ola 2 #1):** `/trips` = **Workbench** (buckets de triage; no `ListPageShell`). Tab **Operación** del detalle = ficha **patio-first**: Flota y tripulación → Programación → Cliente/contrato → staff → Orden de viaje → Datos Carta Porte → km/notas/historial. CTAs de flota en el bloque Flota; no FormSticky / LongForm de padrón.

**Aprobaciones (Ola 2 #2):** `/finance/approvals` = cola **Workbench** (buckets de tipo; no `ListPageShell`). Filtros = `ListingFilterPanel` (queue toggle y operador fuera del panel). `ReturnedAlert` CTAs solo en `DetailAlertCard.action`. Con tipo fijo (bucket activo / `lockedType`): sin columna Tipo. No EntityListCard / FormSticky / LongForm.

**Notificaciones (Ola 2 #3):** `/notifications` = inbox/feed **`ListPageShell`** (no Workbench). Filtros = `ListingFilterPanel`; empty filtrado + Limpiar; error = `DetailAlertCard` + Reintentar (no EmptyState «Sin notificaciones»). Campana (Panel/Sheet): preview no leídas, `EmptyState` size `sm`, error con reintento, «Ver todas» intacto; overlays DS. Deep-link = clic fila (+ chevron/Abrir). No EntityListCard / FormSticky / LongForm. **Ola 2 cerrada** (viajes Workbench + aprobaciones cola + notificaciones inbox).

**Facturas (Ola 3 #1):** `/finance/invoices` = **Workbench** (buckets de estado; no `ListPageShell`; no inventar `ListingFilterPanel` vacío — solo search + buckets). Empty solo shell. Primary Nueva factura + Descargar CFDI outline → Sheet (`?download=` intacto; portal client sin bulk/CTAs staff). Detalle `/invoices/:id`: alertas con job vía **`DetailAlertCard.action`** (follow-through Enviar/Cobrar abre el mismo overlay que la toolbar). Toolbar: **una sola primaria sólida**; pago outline si hay elevación fiscal (Sustituir/Cancelar). Overlays: Sustituir=`Sheet`; Cancel/Pago=`Dialog`; Enviar=`AlertDialog` (confirmación + destinatarios); delete borrador=`AlertDialog`. No EntityListCard / FormSticky / LongForm.

**Cobros (Ola 3 #2):** `/finance/cobros` = **Workbench** (buckets Por cobrar / Pago parcial / Excepciones REP; no `ListPageShell`; no inventar `ListingFilterPanel` — RFC toolbar + chip). Empty solo shell. Bandeja «Cobros de hoy» = `DetailAlertCard` + severidad + dismiss/`Ver excepciones` en `action`. Sticky «Registrar cobro» (patrón Dispatch). Lote = selección de la página actual; filtrar RFC para reunir varias. Overlays: Confirm=`Sheet`; chain repair=`Dialog` + Alert inline; late REP hint en Sheet = warning. Error carga → `DetailAlertCard` + Reintentar en `action`. Excepciones sin Card+header duplicado. No EntityListCard / FormSticky / LongForm.

**Dispatch (Ola 3 #3):** `/finance/dispatch` = **Workbench** (Pendientes/Enviadas; no `ListPageShell` de página). Sticky Enviar = única sólida de cola; Armar = outline. Empty cola solo shell. Error carga → `DetailAlertCard` + Reintentar en `action`. Confirm batch = Sheet. Periodo `/finance/dispatch/period` = `ListPageShell` + `ListingFilterPanel`; empty onboarding XOR filtrado. Create run = Dialog + Alert inline. Detalle `/finance/dispatch/:id`: alertas con job vía **`DetailAlertCard.action`** (empty-scheduled Armar; fallido Armar; no-ready Actualizar lista; error carga Reintentar). Confirm/Reenviar = `AlertDialog`; toolbar **una sola primaria** Enviar o Reenviar. `DispatchRunSendResults` montado en detalle tras envío. No EntityListCard / FormSticky / LongForm.

**Pagos a operadores (Ola 3 #4):** Hub `HubPageShell` (**4 tabs**: Por pagar · Anticipos · Tarifas · Rutas con tarifa fija; **sin** tab «Por autorizar» — el VoBo vive en el bucket **En autorización** de Por pagar y en `/finance/approvals`; `/finance/settlements/pending-approval` solo redirige). Vocabulario único para `pending_approval`: **«En autorización»** (bucket, badge, labels, back-link). Por pagar = **Workbench** `showHeader=false` (`ListingFilterPanel` sucursal; contratistas fuera). Anticipos / Tarifas / Rutas = `ListPageShell` `showHeader=false` bajo hub; **1 filtro toolbar** OK (no inventar panel vacío). Historial = **List deep-link** (`/finance/settlements/registry`, no tab) con status+operador en `ListingFilterPanel`. Empty único shell (tablas devuelven `null` si vacío); error → **un solo** `DetailAlertCard` + Reintentar en `action` (no `isDegraded` del shell además). Banners compensación (assign / duplicados) → `DetailAlertCard.action` cuando hay job. **Sin sticky de cola** (no hay lote multi-select). Overlays: Dialog disburse/VoBo; Sheet corregir. No EntityListCard / FormSticky / LongForm.

**Análisis (Ola 3 #5 — cierre ola):** `/finance/analysis` = **Hub** `HubPageShell` (Mes a mes / Rentabilidad / Gastos; `?view=` + preserve periodo). **No** Workbench ni `ListPageShell`. Controles en toolbar (periodo, alcance, meses, YoY, granularidad); **no** inventar `ListingFilterPanel` vacío. Chips = `ActiveFilterChips` + Limpiar. Empty único por vista; error/alerta con job → `DetailAlertCard.action`. Export outline. No EntityListCard / FormSticky / LongForm / sticky cola. **Ola 3 cerrada** (facturas · cobros · dispatch · liquidaciones · análisis).

**Builder** — usar si **≥ 4 de 6**: (1) múltiples secciones, (2) navegación no lineal, (3) inspector/resumen, (4) construcción iterativa, (5) lenguaje de negocio, (6) completitud progresiva. No extender Wizard con “navegación libre”.

ADR-0090: `design/adr/0090-…` · ADR-0091: `design/adr/0091-…` · Hub SDD: `design/sdd/hub-page-shell/` · Doc: `docs/design-system/patterns.md`.

### `HubPageShell` — props esenciales

```tsx
<HubPageShell
  title="Esquemas de compensación"
  description="…"
  readiness={[
    { id: "templates_active", label: "esquemas activos", value: 3, status: "ok", href: "…" },
  ]}
  readinessAriaLabel="Estado de configuración del módulo"
  orientation={{
    text: "Los esquemas se usan al liquidar.",
    link: { label: "Ir a liquidaciones", href: "/finance/settlements/new" },
  }}
  nav={[
    { id: "templates", label: "Esquemas", href: "/finance/compensation/templates" },
    { id: "corridors", label: "Rutas", href: "/finance/compensation/corridors" },
  ]}
  activeNavId="templates"
  guide={{ title: "Cómo configurar", steps: ["…"], storageKey: "…" }}
>
  <Outlet />
</HubPageShell>
```

**Reglas:** cero dominio en el shell; sin slots = compat v1; `readiness` ≠ awareness de Workbench (configuración vs cola). Feature pasa `HubReadinessItem[]`. Anatomía: Header → Readiness? → Orientation? → Guide? → Nav? → Children → Related config?.

### `ListPageShell` — props esenciales

```tsx
<ListPageShell
  title="Vehículos"
  primaryAction={{ label: "Nuevo", icon: <Plus />, onClick: ..., visible: canCreate }}
  toolbar={{ search: { value, onChange, placeholder }, filters, onRefresh, ... }}
  isLoading={isLoading}
  items={vehicles}
  pagination={{ page, totalPages, total, limit }}
  onPageChange={setPage}
  renderTable={() => <VehicleTable ... />}
  emptyState={{ icon: <Truck />, title: "Sin vehículos", cta: { label: "Nuevo", onClick } }}
/>
```

### Listado — empty, filtros y cards (padrón canónico)

**Empty (contrato EntityListTable):** el `EmptyState` lo monta **solo** `ListPageShell`
vía `emptyState`. La tabla/feature **no** debe renderizar un empty local: con
`items.length === 0` retornar `null` (o no filas). Canónico: `VehicleTable` +
`VehicleListPage`.

**Filtros — `ListingFilterPanel`** (`@shared/ui/listing`):

```tsx
import { ListingFilterPanel } from "@shared/ui/listing";

// En toolbar.filters:
<ListingFilterPanel
  triggerLabel="Filtros"
  activeCount={activePanelFilterCount}
  contentClassName="lg:grid-cols-3" // columnas según campos visibles
>
  {/* Selects / DateRange del dominio */}
</ListingFilterPanel>
```

- Badge «n» solo si `activeCount > 0` (recortes del panel; no search ni vista).
- Abierto por defecto con recortes; cerrado si idle (el usuario puede expandir/colapsar).
- Instancias: `VehicleListFilters`, `DriverListFilters`, `ClientListFilters`. Otros padrones
  (trips/employees/…) migran cuando toque — no clonar Collapsible+Card a mano.

**Cards — `EntityListCard`** (`@shared/ui/listing`):

```tsx
import {
  EntityListCard,
  entityListCardMenuTriggerClassName,
} from "@shared/ui/listing";

<EntityListCard onClick={() => onView(id)}>
  <CardHeader>
    …
    <Button
      variant="ghost"
      size="icon"
      className={entityListCardMenuTriggerClassName}
    >
      <MoreVertical />
    </Button>
  </CardHeader>
  …
</EntityListCard>
```

- Menú ⋯ **usable sin hover** (touch: siempre visible; hover: aparece al
  `group-hover` / `focus-visible` / menú abierto).
- Primera instancia: `VehicleCard`.
- Segunda instancia padrón (list+form): **drivers**.
- Tercera instancia padrón: **clients** — maestro largo (`FormPageShell` edit + sticky/rail/unsaved) y master-detail de hijos (direcciones/contactos) en el detalle; no Sheet del padre.
- Cuarta instancia padrón: **branches** — maestro largo (`FormPageShell` edit + sticky + rail + unsaved); list/detail canónico; lifecycle baja solo en detalle (+ restaurar en Eliminadas).
- Quinta instancia padrón (cierra Ola 1): **employees** — list+detail+create+edit canónico; `FormPageShell` edit con rail + sticky + unsaved; baja solo en detalle (API sin restore).
- **Usuarios (Ola 4 #1):** `/users` = padrón admin `ListPageShell` (no Workbench). Filtros = `ListingFilterPanel`; `EntityListCard` touch; cupo → `DetailAlertCard.action` («Ver Tu plan»); edit corto `FormStickyActions` `sticky={false}` + unsaved (sin `LongFormSectionNav`); alta canónica = `AddUserSheet` (`/users/new` → `/users?create=1`). **Excepción lifecycle (D1):** Activar/Desactivar en menú lista + detalle (acceso), a diferencia del padrón Ola 1. Activity = `ListPageShell`; invitaciones en `beforeToolbar` (no EntityListCard).
- **Settings (Ola 4 #2):** chrome = `SettingsPageShell` (no `SettingsLayout` desde pages). General: load/domicilio legado → `DetailAlertCard.action`. Forms: Billing `FormStickyActions sticky` + unsaved; Avisos `sticky={false}` + unsaved. Dashboard layouts: shell + title/description desde copy; `DashboardCustomizePanel` intacto. Integrations oculto del nav. Sin Hub/Workbench/`ListingFilterPanel`. Catálogos = Ola 4 #3.
- **Catálogos (Ola 4 #3):** `/settings/catalogs*` = Settings admin (`SettingsPageShell`; list tabs ON; detail `hideSidebar`). Directorio = `EntityListCard` sin ⋯; **solo search** (no `ListingFilterPanel` / Workbench / Hub). Empty = `EmptyState` (directorio + valores + filtrado). Solo-lectura → `DetailAlertCard` info sin CTA; error carga → `DetailAlertCard` + Reintentar. Ítem mutable → Sheet; delete → Dialog. Platform / `CatalogImportWizard` / `CatalogSearchInput` fuera. Temas/copy consulta intactos.
- **Help (Ola 4 #4):** `/ayuda*` = `ListPageShell` índice + tickets; `DetailPageShell` artículo + ticket; alta = `CreateTicketSheet`. Índice = `EntityListCard` sin ⋯ (cards-only; **solo search** `toolbar.search` / `ListingSearchInput`; no `ListingFilterPanel` / Workbench / Hub). Empty = `EmptyState` (filtrado + Limpiar; tickets vacíos → Nuevo ticket si on; pausa → mailto + Volver a Ayuda). Error carga → `DetailAlertCard` + Reintentar en `action` (≠ notFound). Panel/Spotlight: empty `EmptyState` size `sm`; error + Reintentar; `ArticleCard` accordion ≠ `EntityListCard`; **sin rediseñar** modelo ADR-0100. CreateTicketSheet: `FieldInlineError` + toast. Platform / API / CMS / flags fuera. No elevar DS.
- **Platform (Ola 4 #5 — cierre ola):** `/platform/*` = chrome **aislado** (`PlatformShell` / `PlatformPageShell`; **nunca** `AppLayout` / sidebar ERP / `SettingsPageShell`). Isolation ADR-0062 non-negotiable (sesión ≠ ERP; link ERP → `/login`). Listados densos = `ListingFilterPanel` + `EntityListCard` touch + empty shell; AR chips de vista **fuera** del panel; catálogos platform = search-only + `EntityListCard` (wizard import intacto). Alertas con job → `DetailAlertCard.action` (audit/AR/pulse/detalle past_due/security MFA). Alta empresa = `FormStickyActions` sticky + unsaved; Security pie = `sticky={false}`. Reader (`platform_support`): sin CTAs de mutación. **Sin** rediseñar lifecycle/billing/pricing/impersonation. No elevar DS. **Ola 4 cerrada** (usuarios · settings · catálogos · help · platform).

**Mutaciones de estado operativo:** solo en **detalle** (`*Actions` variant
`buttons`). El listado es lookup (+ restaurar en vista baja). No
`onChangeStatus` en tabla/card. **Excepción documentada:** Usuarios (Ola 4 #1) — Activar/Desactivar también en lista.

### `WizardPageShell` — props esenciales

```tsx
<WizardPageShell
  title="Nuevo viaje"
  steps={[{ id: "basic", label: "Info general" }, { id: "route", label: "Ruta" }]}
  currentStep={currentStep}
  triggerStepValidation={validateCurrentStep}
  renderStep={(step) => { switch (step.id) { case "basic": return <BasicInfoStep />; ... } }}
  onSubmit={handleSubmit}
  submitLabel="Crear viaje"
  isSubmitting={isCreating}
/>
```

**Regla de wizard:** al avanzar de paso, no mostrar toast de error — usar `FormValidationSummary` para resumir los campos inválidos dentro del paso.

### `BuilderPageShell` — props esenciales

```tsx
<BuilderPageShell
  title="Operador foráneo estándar"
  backHref="/finance/compensation/templates?selected=…"
  sections={[
    { id: "identity", label: "Identidad", status: "complete" },
    { id: "payment", label: "Reglas de pago", status: "partial" },
  ]}
  activeSectionId={activeId}
  onSectionChange={setActiveId}
  renderCanvas={(sectionId) => /* form de la sección */}
  renderInspector={() => /* resumen + completitud + puentes */}
  footerActions={[
    { id: "discard", label: "Descartar", variant: "outline", onClick },
    { id: "save", label: "Guardar", onClick, loading: isSaving },
  ]}
/>
```

**Reglas:** slots genéricos (cero dominio en el shell); ruta propia full-screen (no embeber en Hub); Wizard ≠ Builder.

### `WorkbenchPageShell` — props esenciales

```tsx
<WorkbenchPageShell
  title="Aprobaciones"
  showHeader={!embedded}
  buckets={mapApprovalWorkbenchBuckets({ activeType, counts, onTypeChange })}
  toolbar={{ search, filters, onRefresh, extraActions }}
  renderContent={() => (
    <>
      <BulkActionsBar ... />
      <ApprovalInbox ... />
    </>
  )}
  pagination={pagination}
  onPageChange={setPage}
/>
```

**Reglas:** `buckets` obligatorio; surface = `renderContent` (no `renderTable`); permisos fuera del shell.
---

## Patrón detail-sheet-master-detail

Para entidades con **edición del padre** + **sub-recursos con CRUD propio**:

```
DetailPageShell
├── Header → botón "Editar" abre Sheet (solo el padre)
└── Tabs
    └── Sub-recursos (direcciones, contactos...)
        └── Master-detail layout: [Lista] | [Panel: ver/editar/crear]
```

- Padre → Sheet → 1 mutation al confirmar.
- Sub-recurso → master-detail → mutation inmediata por operación.
- Selección en master-detail: `useMemo` (no `useEffect + setState`).

Skill completo: `.agents/skills/detail-sheet-master-detail/SKILL.md`
Ejemplo canónico: `features/clients/presentation/pages/ClientDetailPage.tsx`

---

## Componentes clave

### Button

```tsx
import { Button } from "@shared/ui/button";
<Button variant="default" leftIcon={<Plus />}>Nuevo viaje</Button>
<Button variant="destructive" isLoading={isDeleting}>Eliminar</Button>
<Button asChild><Link to="/vehicles">Ver flota</Link></Button>  // NO usar leftIcon con asChild
```

Variantes disponibles: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`, `success`, `warning`, `info`

### Badge / StatusBadge

```tsx
// Badge genérico
<Badge variant="success" tone="soft">Completado</Badge>
<Badge variant="info" tone="solid">En Ruta</Badge>

// Para estados de dominio (preferido)
export const TripStatusBadge = createStatusBadgeComponent(TRIP_STATUS_CONFIG);
<TripStatusBadge status={trip.status} />
```

| Estado de dominio | Badge |
|---|---|
| Completado, OK | `variant="success" tone="soft"` |
| Por vencer | `variant="warning" tone="soft"` |
| En progreso activo | `variant="info" tone="solid"` |
| Cancelado, error | `variant="destructive" tone="soft"` |
| Borrador, inactivo | `variant="neutral" tone="soft"` |

### StatCard (KPIs)

```tsx
import { StatCard } from "@shared/ui/data-display/StatCard";
<StatCard title="Ingresos del mes" value="$487,250" icon={<Wallet />} tone="success" />
<StatCard title="Cancelados" value="22" icon={<XCircle />} tone="destructive" />
```

**Dashboard KPI strip:** franja unida `DashboardKpiStrip` (`rounded-2xl border shadow-sm` + celdas con divisores) en `operations_snapshot` — no cuatro cards sueltas.

Tones: `primary` (neutral), `success` (positivo), `warning` (atención), `info`, `destructive`, `neutral`.

### DetailAlertCard (banner de detalle)

```tsx
import { DetailAlertCard } from "@shared/ui/data-display";

<DetailAlertCard
  severity="warning" // critical | warning | info
  icon={<AlertTriangle className="h-5 w-5" />}
  title="Documentos próximos a vencer"
  items={[
    { label: "Seguro", text: "Vence en 12 días" },
  ]}
  action={
    <Button size="sm" variant="outline" onClick={…}>Ver documentos</Button>
  }
/>
```

- Slot opcional `action` (alias `cta`) para CTA del banner — preferir sobre
  meter botones en `children`.
- Alerta que exige acción del operador → siempre CTA (≤1 clic al destino).
- Canónico con CTA: alerta de docs en `VehicleDetailPage`; follow-through fiscal
  (Enviar/Cobrar / auto-dispatch failed) en `InvoiceDetailPage` (Ola 3 #1);
  empty-scheduled / errores recuperables en `DispatchRunDetailPage` (Ola 3 #3).

### DetailSection (sub-secciones en tabs de detalle)

```tsx
import { DetailSection } from "@shared/ui/data-display";
import { Card, CardContent } from "@shared/ui/card";

<DetailSection
  icon={<Truck className="h-4 w-4" />}
  title="Datos de la unidad"
  description="Identificación y capacidades"
>
  <Card>
    <CardContent className="pt-6">{/* InfoRows / contenido */}</CardContent>
  </Card>
</DetailSection>
```

**Receta — una superficie por sección:**
- Header (icono + título + descripción + `actions?`) fuera del Card → `DetailSection`.
- Body en **un** Card (o grid/lista) como hijo. No anidar Card dentro de Card.
- No duplicar el título con `CardHeader`/`CardTitle` si ya usas `DetailSection`.
- Canónico: `VehicleDetailUnitTab` (Unidad / gastos / permiso). Demo: `/design-system` → Padrón.

### Alert vs Toast

- `Alert`: mensajes estáticos en pantalla (info persistente, advertencia de dominio).
- `toastSuccess/toastError/toastWarning/toastInfo/toastPromise`: notificaciones efímeras tras una acción.

```tsx
import { toastSuccess, toastError } from "@shared/hooks/useToast";
toastSuccess("Viaje creado", "ID: #3421");
toastError("Error al guardar");
```

### EmptyState / LoadingPageState

```tsx
<EmptyState icon={<Package />} title="Sin viajes" cta={{ label: "Crear viaje", onClick }} />
<LoadingPageState variant="list" />  // list | detail | form | wizard
```

### Form con RHF

- `RHFSelect` (`@shared/ui/form/RHFSelect`) para selects con React Hook Form — maneja sentinela `__none__` para opcionales.
- En edición: montar el formulario solo cuando hay data (`isLoading` + skeleton en la página contenedora).
- `defaultValues` (no solo `values`) + `key={id ?? "new"}` al cambiar entidad.

---

## Charts — `ChartCard` + `Boeltech*Chart`

Librería canónica en `@shared/ui/data-display` (Recharts envuelto; ADR-0045). **No** importar Recharts directo en features.

| Componente | Cuándo usar |
|---|---|
| `ChartCard` | Contenedor obligatorio: título, loading/error, tools, footer |
| `BoeltechLineChart` | Tendencias temporales (ingresos, viajes/día) |
| `BoeltechBarChart` | Comparaciones categóricas; `stacked` para composición |
| `BoeltechAreaChart` | Serie única con fill suave |
| `BoeltechDonutChart` | Distribución porcentual (estatus, buckets) |
| `Sparkline` | Mini tendencia dentro de `StatCard` |

**Series:** tipar con `ChartSeries[]` — cada serie referencia un token (`chart-1`…`chart-5` o semánticos `success`, `warning`, …).

```tsx
import {
  ChartCard,
  BoeltechBarChart,
  BoeltechLineChart,
  type ChartSeries,
} from "@shared/ui/data-display";

const series: ChartSeries[] = [
  { dataKey: "ingresos", label: "Ingresos", token: "chart-1" },
  { dataKey: "gastos", label: "Gastos", token: "chart-3" },
];

<ChartCard
  title="Ingresos vs gastos"
  description="Tendencia mensual"
  isLoading={isLoading}
  error={error?.message}
  aria-label="Gráfico de barras: ingresos vs gastos"
>
  <BoeltechBarChart data={rows} series={series} valueFormatter={formatMxCurrency} />
</ChartCard>
```

**Reglas:**
- `ChartCard` exige `isLoading` explícito — no omitir el skeleton.
- Preferir `valueFormatter` (p. ej. `formatMxCurrency`) en lugar de formatear en el dato.
- Dashboards analíticos densos pueden usar el skill `tremor-design-system` además de estos primitivos.

Demo viva: `/design-system` → sección Charts (`ChartPaletteSection.tsx`).

---

- Todo `<Input>` asocia un `<Label htmlFor>`.
- Todo botón con solo ícono tiene `aria-label`.
- `:focus-visible` habilitado globalmente.
- Nunca poner información esencial solo en un `Tooltip` (no accesible en touch).

---

## Anti-patrones

❌ `bg-red-500`, `text-green-700` hardcodeados — usar tokens semánticos.

❌ Página custom sin shell — si coincide con alguno, usar el shell.

❌ Estado de badge directo en JSX (`className="bg-green-100"`) — usar `StatusBadge` con config.

❌ Permisos scattered (`hasPermission` en cada botón por separado) — centralizar en `*Actions`.

❌ `useEffect + setState` para selección inicial en master-detail — usar `useMemo`.

❌ Toast de error en wizard al avanzar de paso — usar `FormValidationSummary`.

❌ Recharts directo en features — usar `ChartCard` + `Boeltech*Chart` con tokens `--chart-*`.

❌ Título de página en el header global — usar page shell.

❌ Lista de rutas duplicada fuera de `navigation.ts` / `useNavigation`.

❌ Badge de notificaciones hardcodeado en header — usar API `unread-count`.

❌ Empty local en tabla de listado — empty solo vía `ListPageShell.emptyState`.

❌ Menú ⋯ de card con `opacity-0 group-hover:opacity-100` sin media hover —
usar `entityListCardMenuTriggerClassName` (touch no ve el menú).

❌ Clonar Collapsible+Card «Filtros (n)» en cada feature — usar `ListingFilterPanel`.

❌ Card-en-Card en tabs de detalle — usar `DetailSection` + un solo Card de body.

---

## Patio Marketing (`/welcome`) — superficie vitrina

Landing pública light-only (`src/pages/landing/`). **No** es Operate: no usar shells
List/Detail/Form ni mutar `--palette-*` / tipografía del ERP desde esta superficie.
Tokens y tipografía viven scoped bajo `.landing-root` en `landing.css`.

| Decisión | Regla |
|---|---|
| **D-M1** | Namespace `.landing-*` / `--landing-*` = superficie DS (vitrina), no one-off de feature. |
| **D-M2** | CTA ámbar (`.landing-cta-amber`) = excepción marketing permanente; sombra quieta (borde + 1 capa corta). **Sin** bloom/glow multi-capa. No migrar a teal/`--primary`. |
| **D-M3** | Tipografía marketing (Schibsted Grotesk + IBM Plex) solo bajo `.landing-root`; no contaminar app shell. |
| **D-M4** | Sentence-case patio en labels marketing (badges, eyebrows). Sin ALL-CAPS tracked. |
| **D-M5** | Brand lockup/wordmark = señal **hero-level** en `/welcome` (chrome + ancla tipográfica en el bloque hero), no solo nav. |

**Motion ceilings (trust-first):** Ken Burns hero ≤1% / enter corto; autoplay de evidencia
pausable y **off** con `prefers-reduced-motion`. Copy: `landingCopy.ts`.

**ICP de mensaje (producto, no token):** primer viewport declara flotas **1–30 motrices
(Micro / Pequeña)**; Mediana/Grande solo en `#pricing`.

Pedido de formalización: `pedidos/2026-10-26-landing-profesional-mercado` (`ds_evolution`).

---

## Familia Location (ADR-0092)

Patrón transversal **BUSCAR → ENCONTRAR → CONFIRMAR → USAR** sobre `addresses` (no inventar tabla `locations` en v1).

| Pieza | Cuándo |
|---|---|
| `LocationField` | Entrada canónica de búsqueda/confirmación de lugar |
| `LocationCard` | Valor ya confirmado (Cambiar / Editar) |
| `LocationSheet` | Confirmación progresiva (mapa / CP / ambigüedad) |
| `AddressInput` | Detalle SAT debajo o embebido — **no** sustituir Location por cascada SAT-first |
| `AddressPicker` | Legado; preferir `LocationField` en superficies nuevas |

Importar desde `@shared/ui/location`. Contextos: `fiscal` · `operational` · `tripStop` · `geoPoint`.

README: `src/shared/ui/location/README.md` · Guía: `docs/direcciones/patron-location-usuario.md` · Smoke: `npm run test:smoke:location-field`.

---

## Referencias

| Documento | Ruta |
|---|---|
| App shell (chrome) | `D:\cowork\boeltech\erp-transport\docs\design-system\app-shell.md` |
| Inbox notificaciones (usuario) | `...\docs\notificaciones\inbox-usuario.md` |
| Tokens completos | `D:\cowork\boeltech\erp-transport\docs\design-system\tokens.md` |
| Componentes base | `...\docs\design-system\components.md` |
| Patrones de shell | `...\docs\design-system\patterns.md` |
| Mapas + embeds (dark) | `...\docs\design-system\maps-embeds.md` |
| Form validation UX | `...\docs\design-system\form-validation-pattern.md` |
| Wizard pattern | `...\docs\design-system\wizard-page-pattern.md` |
| Charts (ADR-0045) | `D:\cowork\boeltech\erp-transport\design\adr\0045-charts-library-y-patron-chartcard.md` |
| Detail+Sheet+MD | `.agents/skills/detail-sheet-master-detail/SKILL.md` |
| Página de tokens CSS | `src/app/styles/index.css` |
| Design system showcase | `src/pages/design-system/` |
| Patio Marketing `/welcome` | `src/pages/landing/` · §Patio Marketing arriba |
