/**
 * useCatalogType Hook
 * Clean Architecture - Application Layer (Hooks)
 *
 * Hook para obtener un tipo de catálogo específico con su versión actual.
 * Útil para el wizard de importación donde necesitas la versión actual
 * para generar la versión sugerida.
 *
 * @example
 * const { data: catalogType, isLoading } = useCatalogType("sat_municipio");
 *
 * // Acceder a la versión actual
 * catalogType?.currentVersion?.version // "1.0.20260320"
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  type CatalogAuthScope,
  type CatalogTypeWithVersion,
  type CatalogVersion,
  catalogQueryKeys,
} from "../../domain";
import { catalogRepository } from "../../infrastructure";

export type UseCatalogTypeOptions = Omit<
  UseQueryOptions<CatalogTypeWithVersion | null, Error>,
  "queryKey" | "queryFn"
> & {
  authScope?: CatalogAuthScope;
};

/**
 * Hook para obtener un tipo de catálogo específico por su código.
 *
 * Incluye la versión actual y el conteo de items.
 *
 * @param typeCode - Código del tipo de catálogo (ej: "sat_municipio")
 * @param options - Opciones adicionales de React Query + authScope
 *
 * @example
 * // En CatalogImportWizard:
 * const { data: catalogType } = useCatalogType(typeCode, { authScope: "platform" });
 * const wizard = useCatalogImportWizard(catalogType?.currentVersion);
 */
export function useCatalogType(
  typeCode: string,
  options?: UseCatalogTypeOptions,
) {
  const { authScope, ...queryOptions } = options ?? {};

  return useQuery({
    queryKey: catalogQueryKeys.type(typeCode, authScope),
    queryFn: () =>
      catalogRepository.findTypeByCode(
        typeCode,
        authScope ? { authScope } : undefined,
      ),
    enabled: Boolean(typeCode),
    staleTime: 1000 * 60 * 5, // 5 minutos - refrescar después de importación
    gcTime: 1000 * 60 * 30, // 30 minutos en cache
    ...queryOptions,
  });
}

/**
 * Hook para obtener solo la versión actual de un catálogo.
 *
 * @param typeCode - Código del tipo de catálogo
 *
 * @example
 * const { data: version } = useCatalogCurrentVersion("sat_municipio");
 * // version?.version = "1.0.20260320"
 */
export function useCatalogCurrentVersion(
  typeCode: string,
  options?: Omit<
    UseQueryOptions<CatalogVersion | null, Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: catalogQueryKeys.version(typeCode),
    queryFn: () => catalogRepository.findCurrentVersion(typeCode),
    enabled: Boolean(typeCode),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    ...options,
  });
}

/**
 * Hook para obtener el historial de versiones de un catálogo.
 *
 * @param typeCode - Código del tipo de catálogo
 *
 * @example
 * const { data: versions } = useCatalogVersions("sat_municipio");
 * // versions = [{ version: "1.0.20260325", isCurrent: true }, ...]
 */
export function useCatalogVersions(
  typeCode: string,
  options?: Omit<
    UseQueryOptions<CatalogVersion[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: catalogQueryKeys.versions(typeCode),
    queryFn: () => catalogRepository.findVersions(typeCode),
    enabled: Boolean(typeCode),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    ...options,
  });
}
