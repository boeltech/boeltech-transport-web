---
name: detail-sheet-master-detail
description: Patrón de pantalla de detalle con DetailPageShell, edición del padre en Sheet contextual y sub-recursos (CRUD propio) en layout master-detail dentro de un tab. Úsalo al diseñar o refactorizar detalles de entidad donde hijos se persisten al instante y el padre se edita en overlay sin navegar a otra ruta. Excepción documentada para clientes (padre en página /edit).
---

# Detail + Sheet contextual + sub-recursos master-detail

Variante canónica de **`DetailPageShell`** cuando la entidad tiene **campos editables en el padre** y **sub-recursos con API propia** (crear / actualizar / borrar sin depender de un “Guardar todo” del padre).

## Cuándo aplicar

- El detalle usa **`DetailPageShell`** (header, stats, alertas, tabs, metadata).
- Los datos del **registro principal** se editan en un **`Sheet`** (drawer lateral) **o** en una **ruta `/entity/:id/edit` dedicada** si el formulario padre es largo (ver [excepciones](#excepciones-documentadas)).
- Los **sub-recursos** (ej. direcciones de cliente, ítems anidados) tienen endpoints propios y deben **guardarse al confirmar cada operación**, no mezclarse con un submit global del padre.

## Excepciones documentadas

### Clientes — padre en página completa (Opción A, 2026-05-23)

**Decisión:** `D:\cowork\boeltech\erp-transport\docs\auditorias\clientes-ux-edicion-padre.md`

| Capa | Implementación |
|------|----------------|
| Alta | Wizard — `ClientCreatePage` (cliente + dirección fiscal + revisión) |
| Detalle | `ClientDetailPage` + tab Direcciones |
| Hijos (direcciones) | **Skill alineado** — `ClientAddressMasterDetail` (CRUD inmediato; Sheet solo móvil para el formulario de una dirección) |
| Padre (editar) | **Excepción** — `/clients/:id/edit` → `ClientEditPage` (`FormPageShell`). **Sin** tab de direcciones en esa ruta |

**Regla:** no añadir CRUD de direcciones en `ClientEditPage`. El anti‑patrón es mezclar submit global del padre con hijos que ya persisten por API en otra pantalla — eso **no** ocurre si las direcciones viven solo en el detalle.

**Navegación:** `ClientActions` → `/clients/:id/edit` (opcional `onEdit` para un Sheet futuro).

**No requerido para clientes:** `?edit=true`, `ClientEditRedirect`, Sheet del padre en detalle.

## Por qué existe

Mezclar en una sola pantalla “editar cliente” y “CRUD de direcciones” genera **dos modelos de guardado** (confusión, parches con tabs y doble dirty state). Este patrón separa:

| Capa | Dónde | Persistencia |
|------|--------|--------------|
| Padre | Sheet desde el detalle | Un `PUT`/`PATCH` al cerrar con Guardar |
| Hijo | Tab o sección **master-detail** | `POST` / `PUT` / `DELETE` por ítem al confirmar en su formulario |

## Estructura UX

1. **`DetailPageShell`**: lectura principal, KPIs, alertas de dominio, pestañas.
2. **Acción “Editar” (padre)**: abre **`Sheet`** con el formulario del padre (`defaultValues` desde entidad cargada; mismo formulario que podría usarse en alta si aplica).
3. **Query opcional `?edit=true`**: abre el Sheet al cargar (útil para bookmarks y redirecciones desde rutas legacy).
4. **Redirección legacy**: ruta antigua `/entity/:id/edit` → `/entity/:id?edit=true` con `<Navigate replace />`.
5. **Tab de sub-recursos**: lista compacta + panel (vista / crear / editar) sin abandonar el detalle.

## Master-detail de sub-recursos

- **Lista** (master): ítems ordenados (ej. principal primero); fila seleccionable.
- **Panel** (detail): vista read-only con acciones Editar / Eliminar, o formulario con Guardar / Cancelar.
- **Vacío**: `EmptyState` con CTA para crear el primero.
- **Eliminación**: `AlertDialog` de confirmación.
- El contenedor orquesta modos (`view` | `create` | `edit`) y llama a hooks de React Query por operación.

### Selección de ítem sin `useEffect` + `setState`

Para cumplir reglas como `react-hooks/set-state-in-effect`, **no** sincronizar la selección con efectos que llamen `setSelectedId` en cascada. Preferir **IDs derivados con `useMemo`**:

- `resolvedViewId`: si no hay selección explícita o el id ya no existe en la lista, usar el primer ítem (u otra regla de negocio).
- `detailFetchId`: según modo (`create` no pide detalle; `edit`/`view` usan ids resueltos).
- `listHighlightId`: mismo criterio para resaltar la fila.

Al pasar a **editar** desde la vista sin haber hecho click en la lista, asegurar id explícito (ej. `setSelectedId((prev) => prev ?? resolvedViewId)` en el handler de Editar).

## Referencia en este repo

**Patrón Sheet (cuando aplique):** usar como plantilla módulos nuevos o refactor pendiente.

**Clientes (excepción — padre en `/edit`, hijos en detalle):**

- Detalle: [`ClientDetailPage.tsx`](../../../src/features/clients/presentation/pages/ClientDetailPage.tsx)
- Edición padre: [`ClientEditPage.tsx`](../../../src/features/clients/presentation/pages/ClientEditPage.tsx)
- Master-detail direcciones: [`ClientAddressMasterDetail.tsx`](../../../src/features/clients/presentation/components/ClientAddressMasterDetail.tsx)
- Decisión UX: `D:\cowork\boeltech\erp-transport\docs\auditorias\clientes-ux-edicion-padre.md`

## Toast y errores API desde el Sheet

- El primitivo `Sheet` ya integra toasts interactivos (`modal={false}` + guard Sonner en `SheetContent`). **No** reimplementar en cada feature.
- Errores API **largos** (PAC, SAT): `Alert` inline seleccionable en el formulario del sheet + toast breve vía `useOverlayMutationFeedback` (`@shared/hooks`).
- Errores **cortos**: toast suficiente.
- Validación de formulario: `FormValidationSummary` / `FieldInlineError`; sin toast al fallar Guardar.

Ver design-system skill § Overlays y [`src/shared/ui/toast/README.md`](../../../src/shared/ui/toast/README.md).

## Anti-patrones

- Página de **edición full-screen** del padre **con el mismo tab de sub-recursos** que guardan por API inmediata (doble verdad de guardado). *Nota: `/clients/:id/edit` sin tab direcciones **no** es anti‑patrón.*
- Duplicar `onInteractOutside` / lógica Sonner en sheets de feature.
- Solo toast para errores PAC largos sin Alert inline en el sheet.
- **`useEffect`** que hace `setState` solo para “elegir el primer ítem” o “reparar selección” cuando eso puede ser **estado derivado** en render.
- Sub-recursos que solo existen en memoria hasta un botón “Guardar cliente” si el backend ya expone CRUD por hijo (desalineado con el contrato API).

## Checklist rápido

- [ ] `DetailPageShell` para el layout del detalle.
- [ ] Formulario del padre solo en **Sheet** (o en alta wizard, no duplicado en `/edit` full page sin necesidad).
- [ ] Sub-recursos en **master-detail** con mutaciones explícitas por acción.
- [ ] Selección en lista resuelta con **memo**, no efectos que disparen `setState` síncrono.
- [ ] Legacy `/…/edit` redirige con `?edit=true` si aplica.

## Seguimiento de viajes (operación, no edición en Sheet)

El tab **Seguimiento** en `TripDetailPage` centraliza acciones operativas con transición explícita (ADR-0046 + enmienda 2026-07-29). **Un solo hub** escribe: cabecera «Qué sigue» + CTA de parada; el panel master-detail opera cargas y evidencia. No usar un Sheet maestro para operar paradas/cargas — ver [`docs/viajes/tracking-tab-pattern.md`](D:/cowork/boeltech/erp-transport/docs/viajes/tracking-tab-pattern.md) y `TripTrackingTab.tsx`.

## Viajes `draft` — primer armado de ruta (ADR-0078)

Al **aceptar** ADR-0078 (hecho 2026-08-14), el alta deja de ser wizard en producto: `/trips/new` es canvas de reserva; **completar paradas y mercancías es el detalle**. F0–F4 shipped. **Addendum composer (Aceptado 2026-08-14):** el sheet **no** es la superficie canónica del *primer* armado. Capa 3 E1: composer = master. **Sin cambio API.**

- Tab **Ruta** en `draft`/`scheduled` (`canEditTrip`): **composer = lista master** (filas Origen → escalas → Destino, aunque no haya `trip_stop`) + panel detail. Guardado = array completo (`PUT /trips/:id/stops`). **No** abrir `StopFormSheet` desde el empty. **No** `EmptyState` + CTA «Agregar parada».
- Panel si el slot **no** está persistido: `AddressPicker` (owner `client` | `branch`) + hatch de etiqueta. Sin AddressInput / SAT / geo.
- **Completar domicilio / Editar parada** = `StopFormSheet` siempre como **Sheet** (desktop y móvil). Panel del master-detail = lectura (card) o captura ligera (`AddressPicker` + hatch). No es el CTA por defecto del empty.
- **ADR-0057 no gobierna el alta.** Es corrección fiscal post-cierre (`TripFiscalCorrectionSheet`). No citarlo como «sheet por parada» del primer armado.
- Tab **Cargas**: CRUD por API de cargo (`useAddCargo`), alineado a este skill.
- Replanificación masiva: mismos tabs, no un segundo wizard.
- Selección de fila: `resolvedViewId` con `useMemo`; **no** `useEffect` + `setState` para el primer ítem.

Spec: `D:\cowork\boeltech\erp-transport\design\sdd\trip-canvas-intake\sdd.md` · addendum: `design/adr/0078-addendum-composer-esqueleto-ruta.md`.
