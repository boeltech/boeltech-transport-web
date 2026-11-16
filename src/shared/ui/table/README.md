# `@shared/ui/table` — Tablas Operate

Contrato SoT: `design/tlamx/platforms/web/design.md` §7 (T1–T10).
Skill: `.agents/skills/design-system/SKILL.md` §Tablas Operate.

## Qué exporta

| Export | Uso |
|--------|-----|
| `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, … | Primitivos. Con `density` = Anatomía; **sin** `density` = legado. |
| `EntityListTable` | Listado Operate canónico (card opcional + kinds + sort + empty null). |
| Tipos `EntityListColumn*`, `EntityListSort*`, `EntityListTableProps` | Contrato de columnas / sort. |

## `EntityListTable`

### Props

```tsx
<EntityListTable
  columns={columns}
  rows={rows}
  getRowId={(r) => r.id}
  isLoading={isLoading}
  density="list" // default; o "compact" embebida
  primaryTo={(r) => `/vehicles/${r.id}`}
  sort={sort} // caller ↔ URL
  onSortChange={setSort}
  stickyHeader // o automático si rows.length > 25
  framed={false} // bajo ListPageShell (el shell aporta la card + pie)
  footer={optionalDemoFooter} // demos / embebido fuera del shell
/>
```

| Prop | Default | Notas |
|------|---------|-------|
| `density` | `"list"` | **Siempre** se pasa a `<Table density={…}>`. Nunca omitir. |
| `framed` | `true` | Card propia. Con `ListPageShell` / `ListingResultsFrame` → `framed={false}` (ancla `/vehicles`; workbench list-like). |
| `footer` | — | Slot bajo la tabla (`border-t`). Demos / uso fuera del frame. El pie T8 lo monta `ListingResultsFrame` (vía shell o composición). |
| `stickyHeader` | auto > 25 | Sticky `thead` si `true` **o** filas renderizadas (datos + grupo) > 25. |
| `getGroupKey` / `renderGroupHeader` | — | Filas de grupo (ver §Filas de grupo). Sin ambas props el render no cambia. |
| `sort` / `onSortChange` | — | UI + `aria-sort`; **la URL la cablea el caller**. |
| `primaryTo` / `primaryState` | — | Href (+ `location.state` opcional) del link primario. |

### Kinds (`columns[].kind`)

| Kind | Alineación | Tipografía / formato |
|------|------------|----------------------|
| `primary` | izq. | `<Link to={primaryTo(row)} state={primaryState?.(row)}>` real; fila extiende hit-area. Accessor puede ser `EntityListStackedValue` (link solo en línea 1; p. ej. Unidad+tipo) |
| `text` | izq. | `text-sm`; truncate |
| `meta` | izq. | `text-muted-foreground` |
| `stacked` | izq. | línea 1 medium (`stackedWeight: "normal"` para dinero sin énfasis) + línea 2 `text-xs` muted (`EntityListStackedValue`) |
| `code` | izq. | `font-mono` ~13 px |
| `number` | der. | `font-mono tabular-nums`; `number` → es-MX |
| `money` | der. | `font-mono tabular-nums` + `formatMxCurrency`; negativo destructive |
| `date` | izq. | `formatDate` si ISO/`Date`; nodo ya formateado se respeta |
| `status` | izq. | nodo del accessor (`StatusBadge`); no mapa local |
| `actions` | der. | menú ⋯ del caller; `stopPropagation`; no cuenta en tope de 7 |

**Vacío:** `null` / `undefined` / string vacío → «—» `text-muted-foreground` (T6), excepto `actions`. `status` renderiza el badge si el accessor lo devolvió.

**Convención T5:** máx. **7** columnas de datos + `actions`. No hard-fail en runtime; revisión / skill.

### Empty / loading

| Estado | Comportamiento |
|--------|----------------|
| `!isLoading && rows.length === 0` | `return null` — el **frame/shell** monta `EmptyState` |
| `isLoading` | Misma card + thead; ~5 filas skeleton **por** `columns` / kinds |

### Densidad (T2)

- `list` (default): fila `h-11` (44 px).
- `compact`: fila `h-9` (36 px) — detalle / Sheet / Dialog.
- Encabezado siempre `h-9` muted cuando hay density.

### Filas de grupo

Una sola tabla (un `thead`) con una fila de sección por grupo; los importes de todos los grupos caen en la misma columna. Ancla: **Cobros sin factura** (`OperationalCashPendingTable`).

```tsx
<EntityListTable
  rows={rows} // ya ordenadas por grupo — la tabla no reordena
  getGroupKey={(r) => r.clientId ?? "__none__"}
  renderGroupHeader={({ key, rows: visible }) => {
    const client = clientsByKey.get(key)!; // totales de la API
    return {
      title: client.name, // tal como está guardado, sin uppercase CSS
      meta: `${visible.length} de ${client.tripCount} viajes`,
      cells: {
        pending: client.pendingAmount, // number en columna money → formatMxCurrency
        actions: <Button variant="outline" size="sm">Cobro por lote</Button>,
      },
    };
  }}
/>
```

```ts
getGroupKey?: (row: TRow) => string;
renderGroupHeader?: (group: { key: string; rows: TRow[] }) => {
  title: ReactNode;
  meta?: ReactNode;                              // misma línea, muted, « · »
  cells?: Partial<Record<columnId, ReactNode>>;  // alineadas con la columna
};
```

| Regla | Detalle |
|-------|---------|
| Agrupación | Corridas **consecutivas** con la misma key. Si el grupo continúa en la página siguiente, su fila se repite allí. |
| Etiqueta | `title` (`font-semibold text-foreground`) + `meta` (`text-muted-foreground`) en una línea; abarca desde la 1.ª columna hasta la anterior a la primera columna con contenido en `cells`. |
| Celdas | Alineación y tipografía del kind de su columna (+ `column.className`). `number` en `money` se formatea. |
| Visual | `bg-muted/60 dark:bg-muted`, alto de fila de la densidad, sin `border-t` extra, sin hover, no clicable (`data-entity-group-row`). |
| Subtotales | Pasar el total del grupo que da la API (universo filtrado), no la suma de filas visibles. |
| Acción | `outline sm` en la columna `actions`; la acción de fila queda `ghost` para no competir. |

Anti-patrones: card dentro de card por grupo, un `thead` por grupo, badge en el subtotal, mayúsculas por CSS en el nombre.

### Composición con `ListPageShell` (F3)

`ListPageShell` **posee** la card del bloque de resultados en table-mode (toolbar fuera; empty + pie summary/pagination dentro).

- Bajo el shell: `framed={false}` y **sin** `footer` en `EntityListTable`.
- Fuera del shell / demo: `framed` default (`true`) + `footer` opcional.
- Anti-patrón: card-dentro-de-card (`framed` default dentro del shell).

## Anti-patrones

- `onClick` en `<tr>` que **sustituye** al link (sin `<Link>` real en `primary`) — T7.
- Empty local (`EmptyState` dentro de la feature table) — empty = shell; tabla → `null`.
- Omitir `density` en listado nuevo / usar primitivos legado en padrón nuevo.
- Card-dentro-de-card: `EntityListTable` con `framed` default dentro de `ListPageShell` (usar `framed={false}`).
- Checkboxes de selección en listado CRUD (solo Workbench — T9; no en v1).
- Más de 7 columnas de datos sin `stacked` / detalle.
- Sort solo en memoria sin reflejar URL cuando el listado ya filtra por query.

## Primitivos `Table*`

Sin `density` = **legado** (`h-10` / `p-2` / selected `bg-muted`) hasta migrar. No añadir listados Operate nuevos en legado.

## Demo

`/design-system` → sección **Tablas** (`TablesSection`).
