# Toast (Sonner)

Notificaciones efímeras globales. Un solo `Toaster` montado en `ToastProvider` (app shell).

## Uso

```tsx
import { useToast } from "@shared/hooks";

const { toast, success, error } = useToast();

success("Guardado");
toast({ title: "Aviso", variant: "info", description: "Detalle opcional" });
```

Variantes: `default` | `success` | `error` | `warning` | `info` | `destructive` (alias de `error`).

## Gobernanza de canal (D1)

| Canal | Cuándo |
|-------|--------|
| **Toast** | Éxito o error ≤160 chars |
| **Alert inline** | Error >160 chars **o** Dialog abierto |
| **Inbox** | Jobs async (campana) |
| **FormValidationSummary** | Validación RHF — **sin** toast |

No confundir toast con badge de sidebar ni con el inbox de notificaciones.

## Duración unificada (D2 / D3)

Misma lógica en `toast()`, `toastError` / `error()` y helpers standalone
(`resolveToastDuration` en `@shared/utils/overlayErrorFeedback`):

| Variante | Duración |
|----------|----------|
| success / info / warning / default | 4 s |
| error corto (≤160 chars en description o title) | 6 s |
| error largo (>160) | 8 s |
| error muy largo (>320) | 12 s |

Umbral único de “va inline”: **160 chars**. No reintroducir umbrales 80/120/200 en código nuevo.

## Densidad (D6) y CTA (D7)

- Máx. **1 toast de éxito** por acción.
- Warnings: **un solo** toast `warning` con lista/`formatGroupedWarningDescription` — no bucle N toasts.
- CTA en toast: **máx. 1**, solo next-step del mismo job; no destructivas.

## Stack expandido (D8)

Default Operate: `expand={true}` en `Toaster` / `ToastProvider`. Con varios toasts
visibles, títulos y descripciones quedan legibles **sin hover** (no mazo colapsado).

## Integración con Sheet

Radix Dialog (base de `Sheet`) y Sonner no se coordinan solos. El primitivo [`sheet.tsx`](../sheet/sheet.tsx) aplica **dos capas**:

1. **`modal={false}`** en `Sheet` — el DOM fuera del sheet no queda `inert`; los toasts reciben clics.
2. **Backdrop propio + `useBodyScrollLock`** — Radix con `modal={false}` no oscurece ni bloquea scroll; el primitivo lo compensa.
3. **`onInteractOutside` / `onPointerDownOutside`** — evita que un clic en el toast cierre el sheet (outside click).

La detección de clics en Sonner vive en [`sonnerDismissGuard.ts`](./sonnerDismissGuard.ts). No duplicar en features.

## Integración con Dialog

`Dialog` mantiene `modal={true}`. Con un dialog abierto, los toasts **no son interactivos** (`inert`). Para errores de API mientras el dialog está abierto:

- Mostrar **`Alert` inline** en `DialogContent` (mensaje completo, seleccionable).
- Toast breve opcional o solo tras cerrar el dialog en éxito.

## Errores largos (PAC / SAT) — D4 / D5

| Contexto | Patrón |
|----------|--------|
| Overlay (Sheet/Dialog) | `useOverlayMutationFeedback` — Alert + toast breve; **prohibido** dump `getErrorMessage` solo en toast |
| Page-level fiscal (timbrar sin sheet) | Mensaje >160 → Alert/panel persistente + toast breve; no dump PAC en toast |
| ≤160 chars | Toast suficiente (sheet) o Alert (dialog) |

Helper: `useOverlayMutationFeedback` en `@shared/hooks`. Umbral: `OVERLAY_ERROR_INLINE_THRESHOLD`.

## z-index

- Sheet overlay/content: `z-50`
- Toaster: `z-100` (ver `Toaster.tsx`)

## Demo

`/design-system` → sección Overlays → card **Gobernanza toast (D1 / D7 / D8)**.
