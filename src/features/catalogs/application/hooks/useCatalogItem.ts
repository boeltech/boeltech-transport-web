/**
 * useCatalogItem Hook
 * Clean Architecture - Application Layer (Hooks)
 *
 * Hook para obtener un item específico de catálogo por código.
 *
 * @example
 * const { data: estado } = useCatalogItem(CatalogTypeCode.SAT_ESTADO, 'JAL');
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  type CatalogItem,
  type CatalogTypeCodeValue,
  catalogQueryKeys,
} from "../../domain";
import { catalogRepository } from "../../infrastructure";

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para obtener un item de catálogo por código
 */
export function useCatalogItem(
  typeCode: CatalogTypeCodeValue,
  code: string | undefined | null,
  options?: Omit<
    UseQueryOptions<CatalogItem | null, Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: catalogQueryKeys.item(typeCode, code ?? ""),
    queryFn: () => catalogRepository.findByCode(typeCode, code!),
    enabled: !!code,
    staleTime: 1000 * 60 * 30, // 30 minutos
    gcTime: 1000 * 60 * 60, // 1 hora en cache
    ...options,
  });
}

/**
 * Hook para obtener los hijos de un item (catálogos jerárquicos)
 */
export function useCatalogChildren(
  typeCode: CatalogTypeCodeValue,
  parentCode: string | undefined | null,
  options?: Omit<UseQueryOptions<CatalogItem[], Error>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: catalogQueryKeys.children(typeCode, parentCode ?? ""),
    queryFn: () => catalogRepository.findChildren(typeCode, parentCode!),
    enabled: !!parentCode,
    staleTime: 1000 * 60 * 30, // 30 minutos
    gcTime: 1000 * 60 * 60, // 1 hora en cache
    ...options,
  });
}

/**
 * Hook para obtener un estado por código
 */
export function useEstado(code: string | undefined | null) {
  return useCatalogItem("sat_estado" as CatalogTypeCodeValue, code);
}

/**
 * Hook para obtener un municipio por código
 */
export function useMunicipio(code: string | undefined | null) {
  return useCatalogItem("sat_municipio" as CatalogTypeCodeValue, code);
}

/**
 * Hook para obtener municipios de un estado
 */
export function useMunicipiosByEstado(estadoCode: string | undefined | null) {
  return useCatalogChildren(
    "sat_municipio" as CatalogTypeCodeValue,
    estadoCode,
  );
}

/**
 * Hook para obtener colonias de un municipio
 */
export function useColoniasByMunicipio(
  municipioCode: string | undefined | null,
) {
  return useCatalogChildren(
    "sat_colonia" as CatalogTypeCodeValue,
    municipioCode,
  );
}

/**
 * Hook para obtener localidades de un municipio
 */
export function useLocalidadesByMunicipio(
  municipioCode: string | undefined | null,
) {
  return useCatalogChildren(
    "sat_localidad" as CatalogTypeCodeValue,
    municipioCode,
  );
}
