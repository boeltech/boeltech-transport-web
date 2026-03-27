/**
 * useCatalogStatistics Hook
 * Clean Architecture - Application Layer (Hooks)
 *
 * Hook para obtener estadísticas de todos los catálogos.
 * Útil para la página de administración de catálogos.
 *
 * @example
 * const { data: stats, isLoading } = useCatalogStatistics();
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { type CatalogStatistics, catalogQueryKeys } from "../../domain";
import { catalogRepository } from "../../infrastructure";

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para obtener estadísticas de todos los catálogos
 */
export function useCatalogStatistics(
  options?: Omit<
    UseQueryOptions<CatalogStatistics[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: catalogQueryKeys.statistics(),
    queryFn: () => catalogRepository.getStatistics(),
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos en cache
    ...options,
  });
}

/**
 * Hook para obtener estadísticas agrupadas por fuente
 */
export function useCatalogStatisticsBySource(
  options?: Omit<
    UseQueryOptions<CatalogStatistics[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  const query = useCatalogStatistics(options);

  const groupedData = query.data?.reduce(
    (acc, stat) => {
      const source = stat.source ?? "OTHER";
      if (!acc[source]) {
        acc[source] = [];
      }
      acc[source].push(stat);
      return acc;
    },
    {} as Record<string, CatalogStatistics[]>,
  );

  return {
    ...query,
    groupedData,
  };
}
