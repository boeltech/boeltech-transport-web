// Hook para retrasar actualizaciones hasta que el usuario deje de escribir
export { useDebounce } from "./use-debounce";
export { useDebouncedSearchParam } from "./useDebouncedSearchParam";

// Hook que centraliza filtros + paginación + viewMode para list pages
export { useListingFilters } from "./useListingFilters";
export type {
  FilterDefinition,
  UseListingFiltersOptions,
  UseListingFiltersResult,
} from "./useListingFilters";

// Hook para detectar media queries
export { useMediaQuery } from "./useMediaQuery";

/**
 * Hook para acceder y manipular el tema de la aplicación.
 * Debe usarse dentro de ThemeProvider.
 */
export { useTheme } from "./useTheme";

// Hook para mostrar notificaciones toast
export * from "./useToast";
