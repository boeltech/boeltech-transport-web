/**
 * useCatalogTypes Hook
 * Clean Architecture - Application Layer (Hooks)
 *
 * Hook para obtener los tipos de catálogo disponibles en el sistema.
 *
 * @example
 * const { data: types } = useCatalogTypes();
 * const { data: platformTypes } = useCatalogTypes({ authScope: "platform" });
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  type CatalogAuthScope,
  type CatalogType,
  catalogQueryKeys,
} from "../../domain";
import { catalogRepository } from "../../infrastructure";

export type UseCatalogTypesOptions = Omit<
  UseQueryOptions<CatalogType[], Error>,
  "queryKey" | "queryFn"
> & {
  authScope?: CatalogAuthScope;
};

/**
 * Hook para obtener todos los tipos de catálogo
 */
export function useCatalogTypes(options?: UseCatalogTypesOptions) {
  const { authScope, ...queryOptions } = options ?? {};

  return useQuery({
    queryKey: catalogQueryKeys.types(authScope),
    queryFn: () =>
      catalogRepository.findTypes(authScope ? { authScope } : undefined),
    staleTime: 1000 * 60 * 60, // 1 hora - tipos de catálogo casi nunca cambian
    gcTime: 1000 * 60 * 60 * 24, // 24 horas en cache
    ...queryOptions,
  });
}

export type UseCatalogTypesGroupedOptions = Omit<
  UseQueryOptions<Record<string, CatalogType[]>, Error>,
  "queryKey" | "queryFn"
> & {
  authScope?: CatalogAuthScope;
};

/**
 * Hook para obtener tipos de catálogo agrupados por fuente
 */
export function useCatalogTypesGrouped(
  options?: UseCatalogTypesGroupedOptions,
) {
  const { authScope, ...queryOptions } = options ?? {};

  return useQuery({
    queryKey: catalogQueryKeys.typesGrouped(authScope),
    queryFn: () =>
      catalogRepository.findTypesGrouped(
        authScope ? { authScope } : undefined,
      ),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
    ...queryOptions,
  });
}
