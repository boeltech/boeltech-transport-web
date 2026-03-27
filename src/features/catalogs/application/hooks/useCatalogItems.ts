/**
 * useCatalogItems Hook
 * Clean Architecture - Application Layer (Hooks)
 *
 * Hook para obtener items de un catálogo con soporte para paginación.
 * Diseñado para la tabla de administración de catálogos.
 *
 * @example
 * const { data, isLoading } = useCatalogItems('sat_estado', { limit: 50 });
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  type CatalogItem,
  type CatalogFilterParams,
  catalogQueryKeys,
} from "../../domain";
import { catalogRepository } from "../../infrastructure";

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para obtener items de un catálogo con filtros opcionales
 */
export function useCatalogItems(
  typeCode: string,
  filters?: CatalogFilterParams,
  options?: Omit<UseQueryOptions<CatalogItem[], Error>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: catalogQueryKeys.itemsFiltered(typeCode, filters),
    queryFn: () => catalogRepository.findAll(typeCode, filters),
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos en cache
    ...options,
  });
}

/**
 * Hook para obtener items paginados (para tablas grandes)
 */
export function useCatalogItemsPaginated(
  typeCode: string,
  page: number,
  pageSize: number = 50,
  filters?: Omit<CatalogFilterParams, "limit" | "offset">,
  options?: Omit<UseQueryOptions<CatalogItem[], Error>, "queryKey" | "queryFn">,
) {
  const offset = (page - 1) * pageSize;

  return useQuery({
    queryKey: catalogQueryKeys.itemsFiltered(typeCode, {
      ...filters,
      limit: pageSize,
      offset,
    }),
    queryFn: () =>
      catalogRepository.findAll(typeCode, {
        ...filters,
        limit: pageSize,
        offset,
      }),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    ...options,
  });
}
