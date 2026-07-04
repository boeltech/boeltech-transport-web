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

## Errores largos (PAC / SAT)

| Longitud | Patrón |
|----------|--------|
| ≤ 160 chars | Toast suficiente (en sheet) o Alert (en dialog) |
| > 160 chars | `Alert` inline en el overlay + toast con «Revisa el mensaje en el formulario» |

Helper: `useOverlayMutationFeedback` en `@shared/hooks`.

## z-index

- Sheet overlay/content: `z-50`
- Toaster: `z-100` (ver `Toaster.tsx`)

## Demo

`/design-system` → sección Overlays.
