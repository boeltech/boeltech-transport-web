/**
 * ListPageShell
 * Shared UI - Page Shells
 *
 * Esqueleto estándar para páginas de listado del ERP.
 * Reemplaza el patrón duplicado en VehicleListPage, DriversListPage,
 * EmployeesListPage, ClientsListPage, TripsListPage.
 *
 * Estructura:
 *   1. Header (título + descripción + acción primaria)
 *   2. Toolbar (search + filtros + acciones extras + refresh + viewMode)
 *   3. Active filter chips
 *   4. Results summary
 *   5. Contenido (table o cards grid; viewMode lo decide)
 *   6. Empty state cuando items vacío
 *   7. Pagination
 *
 * El shell NO maneja queries ni permisos. La página inyecta:
 * - data (`items`, `pagination`, `isLoading`)
 * - handlers (refetch, page change, etc.)
 * - render slots (`renderTable`, `renderCards`)
 */

import { memo, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@shared/ui/button";
import {
  ActiveFilterChips,
  ListingPagination,
  ListingResultsSummary,
  ListingSearchInput,
  ViewModeToggle,
  type ActiveFilterChip,
  type ListingViewMode,
} from "@shared/ui/listing";
import { EmptyState, type EmptyStateProps } from "@shared/ui/feedback-states";
import { cn } from "@shared/lib/utils/cn";

// ============================================================================
// TYPES
// ============================================================================

export interface ListPageShellPrimaryAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  /**
   * Si es false, la acción no se renderiza.
   * Permite ocultarla por permisos sin condicionales adentro del JSX.
   */
  visible?: boolean;
  /** Deshabilita el botón (p. ej. límite de plan alcanzado). */
  disabled?: boolean;
  /** Tooltip / title cuando está deshabilitado. */
  disabledTitle?: string;
}

export interface ListPageShellToolbar {
  /** Props para el `ListingSearchInput` (típicamente `f.searchProps`). */
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  /** Slot para los `<Select>` de filtros. */
  filters?: ReactNode;
  /** Slot para acciones extras (botones especiales como "Licencias por vencer"). */
  extraActions?: ReactNode;
  /** Si es función, se renderiza el botón refresh; si null/undefined, no. */
  onRefresh?: () => Promise<void> | void;
  /** Indicador de loading para el botón refresh. */
  isRefreshing?: boolean;
  /** Chips de filtros activos. Vacío oculta la fila. */
  activeFilterChips?: ActiveFilterChip[];
  /** Handler para "Limpiar filtros". Si está y hasFilters es true, se muestra. */
  onClearFilters?: () => void;
  /** Bandera para mostrar "Limpiar filtros". */
  hasFilters?: boolean;
  /** Si está, se renderiza el ViewModeToggle. */
  viewMode?: {
    value: ListingViewMode;
    onChange: (mode: ListingViewMode) => void;
  };
}

export interface ListPageShellPagination {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
}

export interface ListPageShellProps<TItem> {
  // ── Header ────────────────────────────────────────────────────────────────
  title: string;
  description?: string;
  primaryAction?: ListPageShellPrimaryAction;
  /** Si es false, no renderiza el bloque de título/acción (p. ej. listado embebido en tabs). */
  showHeader?: boolean;
  /** Contenido encima de la toolbar (KPIs, banners). */
  beforeToolbar?: ReactNode;

  // ── Toolbar ───────────────────────────────────────────────────────────────
  toolbar?: ListPageShellToolbar;

  // ── Data ──────────────────────────────────────────────────────────────────
  isLoading: boolean;
  items: TItem[];
  pagination?: ListPageShellPagination;
  onPageChange?: (page: number) => void;
  /** Etiqueta plural para "Mostrando X de Y vehículos". */
  entityLabelPlural: string;

  // ── Render slots ──────────────────────────────────────────────────────────
  /** Render del modo tabla. Recibe los items para que el callsite los pase a su Table. */
  renderTable: () => ReactNode;
  /** Render del modo cards (requerido si toolbar.viewMode existe). */
  renderCards?: () => ReactNode;
  /** Skeleton individual para el grid de cards mientras carga. */
  renderCardSkeleton?: () => ReactNode;
  /** Cantidad de skeletons en el grid. Por defecto 6. */
  cardSkeletonCount?: number;

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyState: Omit<EmptyStateProps, "size">;

  // ── Misc ──────────────────────────────────────────────────────────────────
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

function ListPageShellInner<TItem>({
  title,
  description,
  primaryAction,
  showHeader = true,
  beforeToolbar,
  toolbar,
  isLoading,
  items,
  pagination,
  onPageChange,
  entityLabelPlural,
  renderTable,
  renderCards,
  renderCardSkeleton,
  cardSkeletonCount = 6,
  emptyState,
  className,
}: ListPageShellProps<TItem>) {
  const showActionButton = primaryAction && primaryAction.visible !== false;
  const viewMode = toolbar?.viewMode?.value ?? "table";
  const hasItems = items.length > 0;

  return (
    <div className={cn("space-y-6", className)}>
      {/* ====================================================================
       * Header
       * ================================================================== */}
      {showHeader ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {description ? (
              <p className="text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {showActionButton ? (
            <Button
              onClick={primaryAction.onClick}
              leftIcon={primaryAction.icon}
              disabled={primaryAction.disabled}
              title={primaryAction.disabled ? primaryAction.disabledTitle : undefined}
            >
              {primaryAction.label}
            </Button>
          ) : null}
        </div>
      ) : null}

      {beforeToolbar}

      {/* ====================================================================
       * Toolbar
       * ================================================================== */}
      {toolbar ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {toolbar.search ? (
              <ListingSearchInput
                value={toolbar.search.value}
                onChange={toolbar.search.onChange}
                placeholder={toolbar.search.placeholder ?? "Buscar..."}
              />
            ) : null}

            {toolbar.filters}

            {toolbar.extraActions}

            {toolbar.hasFilters && toolbar.onClearFilters ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={toolbar.onClearFilters}
              >
                Limpiar filtros
              </Button>
            ) : null}

            {toolbar.onRefresh ? (
              <Button
                variant="outline"
                size="icon"
                onClick={toolbar.onRefresh}
                disabled={toolbar.isRefreshing}
                aria-label="Actualizar lista"
              >
                <RefreshCw
                  className={cn(
                    "h-4 w-4",
                    toolbar.isRefreshing && "animate-spin",
                  )}
                />
              </Button>
            ) : null}

            {toolbar.viewMode ? (
              <ViewModeToggle
                value={toolbar.viewMode.value}
                onChange={toolbar.viewMode.onChange}
              />
            ) : null}
          </div>

          {toolbar.activeFilterChips && toolbar.activeFilterChips.length > 0 ? (
            <ActiveFilterChips chips={toolbar.activeFilterChips} />
          ) : null}
        </div>
      ) : null}

      {/* ====================================================================
       * Results summary
       * ================================================================== */}
      {pagination ? (
        <ListingResultsSummary
          entityLabelPlural={entityLabelPlural}
          total={pagination.total}
          page={pagination.page}
          limit={pagination.limit}
        />
      ) : null}

      {/* ====================================================================
       * Content
       * ================================================================== */}
      {viewMode === "table" ? (
        isLoading || hasItems ? (
          renderTable()
        ) : (
          <EmptyState {...emptyState} />
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading && renderCardSkeleton ? (
            Array.from({ length: cardSkeletonCount }).map((_, i) => (
              <span key={i}>{renderCardSkeleton()}</span>
            ))
          ) : !hasItems ? (
            <div className="col-span-full">
              <EmptyState {...emptyState} />
            </div>
          ) : (
            renderCards?.()
          )}
        </div>
      )}

      {/* ====================================================================
       * Pagination
       * ================================================================== */}
      {pagination && onPageChange ? (
        <ListingPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
        />
      ) : null}
    </div>
  );
}

/**
 * `memo` sobre el componente genérico requiere conservar la firma genérica.
 * Casteamos para mantener inferencia de `TItem` desde la callsite.
 */
export const ListPageShell = memo(ListPageShellInner) as <TItem>(
  props: ListPageShellProps<TItem>,
) => ReturnType<typeof ListPageShellInner>;

export default ListPageShell;
