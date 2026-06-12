/**
 * useListingFilters
 * Shared Hooks
 *
 * Hook que centraliza el estado de filtros típico de las list pages:
 * - search debounceado vía URL
 * - múltiples filtros declarativos vía URL
 * - paginación vía URL
 * - viewMode local (table | cards)
 * - chips activos auto-generados
 * - clearAll
 *
 * Reemplaza el patrón repetido de ~100 líneas en cada list page
 * (VehicleListPage, DriversListPage, EmployeesListPage, ClientsListPage,
 * TripsListPage).
 *
 * @example
 * const f = useListingFilters({
 *   filters: { status: {}, type: {} },
 *   chipLabels: {
 *     status: (v) => `Estado: ${STATUS_LABELS[v]}`,
 *     type:   (v) => `Tipo: ${TYPE_LABELS[v]}`,
 *   },
 * });
 *
 * // En la página:
 * useVehicles({ page: f.page, search: f.search, status: f.filters.status });
 *
 * // Pasar al shell:
 * <ListPageShell toolbar={{ search: f.searchProps, ... }}>
 */

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebouncedSearchParam } from "./useDebouncedSearchParam";
import type { ActiveFilterChip } from "@shared/ui/listing";
import type { ListingViewMode } from "@shared/ui/listing";

// ============================================================================
// TYPES
// ============================================================================

export interface FilterDefinition {
  /** Nombre del query param. Si se omite, se usa la key del registro. */
  paramName?: string;
}

export interface UseListingFiltersOptions<TFilterKeys extends string> {
  /**
   * Diccionario de filtros que la página maneja.
   * Las keys son los nombres lógicos; los valores describen cómo se serializan.
   *
   * @example
   * { status: {}, type: { paramName: "vehicleType" } }
   */
  filters?: Record<TFilterKeys, FilterDefinition>;
  /**
   * Generadores de label para los chips de filtros activos.
   * Reciben el valor crudo del URL y devuelven el texto a mostrar.
   * Si no se define, no se renderiza chip para ese filtro.
   */
  chipLabels?: Partial<Record<TFilterKeys, (value: string) => string>>;
  /** Param name para search. Por defecto "search". */
  searchParamName?: string;
  /** Param name para page. Por defecto "page". */
  pageParamName?: string;
  /** Delay del debounce en ms. Por defecto 300. */
  searchDelayMs?: number;
  /** Modo de vista inicial. Por defecto "table". */
  initialViewMode?: ListingViewMode;
  /**
   * Query params que se conservan al llamar `clearAll` (p. ej. `tab` en Finanzas).
   */
  preserveParamsOnClear?: string[];
  /**
   * Valores por defecto de filtros; no cuentan como activos en `hasFilters` ni chips.
   */
  defaultFilterValues?: Partial<Record<TFilterKeys, string>>;
  /** Si false, cambiar filtros no resetea `page` en la URL. Por defecto true. */
  resetPageOnFilterChange?: boolean;
}

export interface UseListingFiltersResult<TFilterKeys extends string> {
  // ── Estado actual ──────────────────────────────────────────────────────────
  page: number;
  search: string;
  searchInput: string;
  filters: Record<TFilterKeys, string>;
  viewMode: ListingViewMode;
  hasFilters: boolean;

  // ── Setters ────────────────────────────────────────────────────────────────
  setSearchInput: (value: string) => void;
  setFilter: (name: TFilterKeys, value: string) => void;
  /**
   * Actualiza varios filtros en un solo `setSearchParams`.
   * Úsalo cuando en un mismo handler debas tocar más de un filtro; si no,
   * varias llamadas a `setFilter` pueden pisarse al batching de React.
   */
  setFilters: (patch: Partial<Record<TFilterKeys, string>>) => void;
  setPage: (page: number) => void;
  setViewMode: (mode: ListingViewMode) => void;
  clearAll: () => void;

  // ── Props para componentes ────────────────────────────────────────────────
  /** Listo para inyectar en `ListingSearchInput`. */
  searchProps: {
    value: string;
    onChange: (value: string) => void;
  };
  /** Listo para inyectar en `ViewModeToggle`. */
  viewModeProps: {
    value: ListingViewMode;
    onChange: (mode: ListingViewMode) => void;
  };
  /** Chips activos auto-generados (incluye search si tiene valor). */
  activeChips: ActiveFilterChip[];
}

function isActiveFilterValue(value: string, defaultValue: string): boolean {
  if (!value) return false;
  if (value === "all") return defaultValue !== "all";
  return value !== defaultValue;
}

// ============================================================================
// HOOK
// ============================================================================

export function useListingFilters<TFilterKeys extends string = string>(
  options: UseListingFiltersOptions<TFilterKeys> = {},
): UseListingFiltersResult<TFilterKeys> {
  const {
    filters: filterDefinitions,
    chipLabels,
    searchParamName = "search",
    pageParamName = "page",
    searchDelayMs = 300,
    initialViewMode = "table",
    preserveParamsOnClear,
    defaultFilterValues,
    resetPageOnFilterChange = true,
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ListingViewMode>(initialViewMode);

  // ── Lecturas desde URL ─────────────────────────────────────────────────────
  const page = parseInt(searchParams.get(pageParamName) || "1", 10);
  const search = searchParams.get(searchParamName) || "";

  const filterEntries = useMemo(
    () =>
      filterDefinitions
        ? (Object.entries(filterDefinitions) as Array<
            [TFilterKeys, FilterDefinition]
          >)
        : [],
    [filterDefinitions],
  );

  const filters = useMemo(() => {
    const result = {} as Record<TFilterKeys, string>;
    for (const [key, def] of filterEntries) {
      const paramName = def.paramName ?? key;
      result[key] = searchParams.get(paramName) || "";
    }
    return result;
  }, [filterEntries, searchParams]);

  // ── Debounced search ──────────────────────────────────────────────────────
  const { searchInput, setSearchInput } = useDebouncedSearchParam(
    search,
    setSearchParams,
    {
      paramName: searchParamName,
      delayMs: searchDelayMs,
      resetPageParamName: pageParamName,
    },
  );

  // ── Setters ────────────────────────────────────────────────────────────────
  const setFilter = useCallback(
    (name: TFilterKeys, value: string) => {
      const def = filterDefinitions?.[name];
      const paramName = def?.paramName ?? name;
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (value && value !== "all") params.set(paramName, value);
        else params.delete(paramName);
        if (resetPageOnFilterChange) params.set(pageParamName, "1");
        return params;
      });
    },
    [filterDefinitions, pageParamName, resetPageOnFilterChange, setSearchParams],
  );

  const setFilters = useCallback(
    (patch: Partial<Record<TFilterKeys, string>>) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        for (const name of Object.keys(patch) as TFilterKeys[]) {
          const value = patch[name] ?? "";
          const def = filterDefinitions?.[name];
          const paramName = def?.paramName ?? name;
          if (value && value !== "all") params.set(paramName, value);
          else params.delete(paramName);
        }
        if (resetPageOnFilterChange) params.set(pageParamName, "1");
        return params;
      });
    },
    [filterDefinitions, pageParamName, resetPageOnFilterChange, setSearchParams],
  );

  const setPage = useCallback(
    (newPage: number) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.set(pageParamName, String(newPage));
        return params;
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [pageParamName, setSearchParams],
  );

  const clearAll = useCallback(() => {
    setSearchInput("");
    setSearchParams((prev) => {
      if (!preserveParamsOnClear?.length) return new URLSearchParams();
      const next = new URLSearchParams();
      for (const key of preserveParamsOnClear) {
        const value = prev.get(key);
        if (value != null) next.set(key, value);
      }
      return next;
    });
  }, [preserveParamsOnClear, setSearchInput, setSearchParams]);

  // ── Estado derivado ────────────────────────────────────────────────────────
  const hasFilters = useMemo(() => {
    if (search.trim()) return true;
    for (const [key] of filterEntries) {
      const value = filters[key];
      const defaultValue = defaultFilterValues?.[key] ?? "";
      if (isActiveFilterValue(value, defaultValue)) return true;
    }
    return false;
  }, [search, filters, filterEntries, defaultFilterValues]);

  // ── Chips ──────────────────────────────────────────────────────────────────
  const activeChips = useMemo<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];

    if (search.trim()) {
      chips.push({
        id: "search",
        label: `Búsqueda: "${search}"`,
        onRemove: () => setSearchInput(""),
      });
    }

    for (const [key, def] of filterEntries) {
      const value = filters[key];
      const defaultValue = defaultFilterValues?.[key] ?? "";
      if (!isActiveFilterValue(value, defaultValue)) continue;
      const labelFn = chipLabels?.[key];
      if (!labelFn) continue;
      chips.push({
        id: def.paramName ?? key,
        label: labelFn(value),
        onRemove: () => setFilter(key, ""),
      });
    }

    return chips;
  }, [
    search,
    filters,
    filterEntries,
    defaultFilterValues,
    chipLabels,
    setSearchInput,
    setFilter,
  ]);

  // ── Props pre-armadas ──────────────────────────────────────────────────────
  const searchProps = useMemo(
    () => ({
      value: searchInput,
      onChange: setSearchInput,
    }),
    [searchInput, setSearchInput],
  );

  const viewModeProps = useMemo(
    () => ({
      value: viewMode,
      onChange: setViewMode,
    }),
    [viewMode],
  );

  return {
    page,
    search,
    searchInput,
    filters,
    viewMode,
    hasFilters,
    setSearchInput,
    setFilter,
    setFilters,
    setPage,
    setViewMode,
    clearAll,
    searchProps,
    viewModeProps,
    activeChips,
  };
}
