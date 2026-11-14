# Listing UI Pattern

Patrón reusable para pantallas de listado (clientes, viajes, vehículos, conductores, etc.).

## Componentes

- `ListingSearchInput`: buscador con icono
- `ViewModeToggle`: toggle table/cards
- `ActiveFilterChips`: chips de filtros activos con acción de remover
- `ListingResultsSummary`: texto de rango mostrado y total
- `ListingPagination`: paginación T8 (Anterior / números / Siguiente; página actual `secondary`; sin Primera/Última). Prop `embedded` para pie de card (sin `border-t` propio).
- `ListingFilterPanel`: trigger «Filtros (n)» + Collapsible + Card/grid (recortes del padrón)
- `EntityListCard` + `entityListCardMenuTriggerClassName`: card de listado; menú ⋯ usable sin hover

### Empty state (contrato)

El empty del padrón vive **solo** en `ListPageShell` (`emptyState`), **dentro**
de la card de resultados en `viewMode=table`. Las tablas (`EntityListTable`,
`VehicleTable`, etc.) deben devolver `null` (o no montar filas) cuando
`items.length === 0` — **no** renderizar un segundo `EmptyState` local.

### Mutaciones de estado operativo

Cambio de estado de dominio (`available` / `maintenance` / …) = **detalle**
(`DetailPageShell` + `*Actions` variant buttons). El listado es lookup
(+ restaurar en vista baja si aplica). No cablear `onChangeStatus` en cards/tabla.

## Hook recomendado

- `useDebouncedSearchParam` (`@shared/hooks`)
  - Sincroniza el input de búsqueda con URL params usando debounce
  - Evita actualizaciones en cada tecla y mantiene `page=1` al filtrar

## Uso base

```tsx
const { searchInput, setSearchInput } = useDebouncedSearchParam(
  searchParamValue,
  setSearchParams,
  { delayMs: 300 }
);

<ListingSearchInput
  value={searchInput}
  onChange={setSearchInput}
  placeholder="Buscar..."
/>

<ViewModeToggle value={viewMode} onChange={setViewMode} />

<ActiveFilterChips chips={chips} />

<ListingResultsSummary
  entityLabelPlural="clientes"
  total={pagination.total}
  page={page}
  limit={pagination.limit}
/>

{/* Pie de card (ListPageShell ya lo monta): embedded evita border-t doble */}
<ListingPagination
  page={page}
  totalPages={pagination.totalPages}
  onPageChange={handlePageChange}
  embedded
/>
```

## Mini guía anti-drift (UX copy/tokens)

Usa estas reglas para mantener consistencia visual y de texto entre módulos.

### 1) Encabezado de página

- Título: plural de la entidad, en `font-bold tracking-tight` (ej. `Clientes`, `Viajes`).
- Subtítulo: frase corta de gestión (ej. `Gestiona los viajes de tu flota`).
- CTA principal:
  - Formato: `Nuevo <Entidad>`.
  - Capitalización recomendada: `Nuevo Viaje`, `Nuevo Vehículo`, `Nuevo Empleado`.

### 2) Búsqueda y filtros

- Placeholder del buscador:
  - Base: `Buscar <entidad singular>...`
  - Si aplica: `Buscar por <campos clave>...` (ej. `nombre, RFC, CURP`).
- Orden recomendado de controles:
  1. `ListingSearchInput`
  2. Filtros por `Select`/botones específicos del dominio
  3. `Limpiar filtros` (solo si hay filtros activos)
  4. `Refresh` (botón icon-only)
  5. `ViewModeToggle` al extremo derecho
- Siempre resetear `page=1` al modificar cualquier filtro.

### 3) Chips de filtros activos

- Prefijos estandarizados:
  - `Búsqueda: "..."`
  - `Estado: ...`
  - `Tipo: ...`
  - `Fecha: ...`
- Cada chip debe permitir remover solo ese filtro.
- Mantener labels cortos y legibles (evitar textos largos en chip).

### 4) Resumen de resultados y paginación

- Usar siempre `ListingResultsSummary` para el texto de rango/total.
- Usar siempre `ListingPagination` para navegación entre páginas (T8: sin Primera/Última; página actual `secondary`).
- En `ListPageShell` table-mode el patrón es **una card**:
  - Toolbar **fuera**
  - Interior: tabla | empty
  - Pie `border-t`: summary + pagination (`embedded`)
- Fuera del shell (workbench, sheets): `ListingPagination` standalone (con `border-t` propio salvo `embedded`).

### 5) Estado vacío (empty state)

- Título: `No se encontraron <entidad plural>`.
- Mensaje secundario:
  - Con filtros: `Intenta ajustar los filtros de búsqueda`.
  - Sin filtros: `Comienza agregando tu primer <entidad singular>`.
- Acción:
  - Con filtros: botón `Limpiar filtros`.
  - Sin filtros: CTA `Nuevo <Entidad>` (si hay permisos).

### 6) Checklist rápido por PR

- [ ] Usa `useDebouncedSearchParam` para búsqueda.
- [ ] Usa los 5 componentes shared del patrón.
- [ ] CTA principal y del empty state usan `Nuevo <Entidad>`.
- [ ] Labels de chips siguen prefijos estandarizados.
- [ ] No hay paginación ni chips "manuales" duplicados.

