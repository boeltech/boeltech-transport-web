/**
 * useCatalogStatistics Hook
 * Clean Architecture - Application Layer (Hooks)
 *
 * Hook para obtener estadísticas de todos los catálogos.
 * Útil para la página de administración de catálogos.
 *
 * @example
 * const { data: stats, isLoading } = useCatalogStatistics();
 * const { data: platformStats } = useCatalogStatistics({ authScope: "platform" });
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  type CatalogAuthScope,
  type CatalogStatistics,
  catalogQueryKeys,
} from "../../domain";
import { catalogRepository } from "../../infrastructure";

export type UseCatalogStatisticsOptions = Omit<
  UseQueryOptions<CatalogStatistics[], Error>,
  "queryKey" | "queryFn"
> & {
  authScope?: CatalogAuthScope;
};

/**
 * Hook para obtener estadísticas de todos los catálogos
 */
export function useCatalogStatistics(options?: UseCatalogStatisticsOptions) {
  const { authScope, ...queryOptions } = options ?? {};

  return useQuery({
    queryKey: [...catalogQueryKeys.statistics(), authScope ?? "tenant"] as const,
    queryFn: () =>
      catalogRepository.getStatistics(
        authScope ? { authScope } : undefined,
      ),
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos en cache
    ...queryOptions,
  });
}

/**
 * Hook para obtener estadísticas agrupadas por fuente
 */
export function useCatalogStatisticsBySource(
  options?: UseCatalogStatisticsOptions,
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
