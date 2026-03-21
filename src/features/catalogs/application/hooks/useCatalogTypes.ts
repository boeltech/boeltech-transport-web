/**
 * useCatalogTypes Hook
 * Clean Architecture - Application Layer (Hooks)
 *
 * Hook para obtener los tipos de catálogo disponibles en el sistema.
 *
 * @example
 * const { data: types } = useCatalogTypes();
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { type CatalogType, catalogQueryKeys } from "../../domain";
import { catalogRepository } from "../../infrastructure";

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para obtener todos los tipos de catálogo
 */
export function useCatalogTypes(
  options?: Omit<UseQueryOptions<CatalogType[], Error>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: catalogQueryKeys.types(),
    queryFn: () => catalogRepository.findTypes(),
    staleTime: 1000 * 60 * 60, // 1 hora - tipos de catálogo casi nunca cambian
    gcTime: 1000 * 60 * 60 * 24, // 24 horas en cache
    ...options,
  });
}
