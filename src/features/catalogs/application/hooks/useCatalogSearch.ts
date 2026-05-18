/**
 * Catalog Search Hooks
 * Clean Architecture - Application Layer
 *
 * Hooks para búsqueda en catálogos SAT grandes que requieren
 * búsqueda del lado del servidor.
 *
 * ACTUALIZADO: Soporte para paginación con offset
 *
 * Catálogos soportados:
 * - sat_municipio (~2,500 items)
 * - sat_localidad (~45,000 items)
 * - sat_colonia (~145,000 items)
 * - sat_codigo_postal (~32,000 items)
 * - sat_clave_prod_serv_cp (~1,200 items)
 * - sat_clave_unidad (~2,400 items)
 * - sat_material_peligroso (~3,800 items)
 *
 * Ubicación: src/features/catalogs/application/hooks/useCatalogSearch.ts
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { catalogRepository } from "../../infrastructure/catalogRepository";
import {
  catalogQueryKeys,
  type CatalogFilterParams,
  type CatalogItem,
  type CatalogOption,
  type CatalogOptionsParams,
  type CatalogSearchParams,
  type CatalogSearchResult,
  type CatalogTypeCodeValue,
} from "../../domain";

// ============================================================================
// HOOK: useCatalogItems (para obtener items de un catálogo con filtros opcionales)
// ============================================================================

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

// ============================================================================
// HOOK: useCatalogOptions (para catálogos pequeños o filtrados)
// ============================================================================

/**
 * Hook para obtener todas las opciones de un catálogo pequeño
 * o las opciones filtradas por padre.
 *
 * Ideal para:
 * - sat_estado (32 items)
 * - sat_tipo_permiso (20 items)
 * - sat_colonia filtrado por CP (<50 items típicamente)
 *
 * @example
 * const { data: estados } = useCatalogOptions("sat_estado");
 * const { data: colonias } = useCatalogOptions("sat_colonia", { parentCode: "01000" });
 */
export function useCatalogOptions(
  typeCode: CatalogTypeCodeValue,
  params: CatalogOptionsParams = {},
) {
  const { parentCode, enabled = true } = params;

  return useQuery({
    queryKey: ["catalog-options", typeCode, parentCode],
    queryFn: async (): Promise<CatalogOption[]> => {
      const result = await catalogRepository.findAllAsOptions(
        typeCode,
        parentCode,
      );

      return result;
    },
    enabled,
    staleTime: 5 * 60_000, // 5 minutos (estos cambian poco)
    gcTime: 30 * 60_000, // 30 minutos
  });
}

// ============================================================================
// TIPOS EXTENDIDOS PARA PAGINACIÓN
// ============================================================================

export interface CatalogSearchParamsExtended extends CatalogSearchParams {
  /**
   * Offset para paginación (número de registros a saltar)
   */
  offset?: number;
  /**
   * Si incluir items inactivos en la búsqueda
   */
  includeInactive?: boolean;
  /** Desactiva la query (p. ej. listado en cliente para catálogos pequeños). */
  enabled?: boolean;
}

// ============================================================================
// HOOK: useCatalogSearch
// ============================================================================

/**
 * Hook para buscar items en catálogos grandes con paginación del servidor.
 *
 * @example
 * // Búsqueda simple
 * const { data, isLoading } = useCatalogSearch("sat_municipio", {
 *   query: searchTerm,
 *   parentCode: estadoCode,
 *   limit: 20,
 * });
 *
 * // Con paginación
 * const { data, isLoading } = useCatalogSearch("sat_localidad", {
 *   query: searchTerm,
 *   limit: 50,
 *   offset: (currentPage - 1) * 50,
 * });
 */
export function useCatalogSearch(
  typeCode: CatalogTypeCodeValue | string,
  params: CatalogSearchParamsExtended,
) {
  const {
    query,
    parentCode,
    limit = 50,
    offset = 0,
    includeInactive = true,
    enabled: enabledParam = true,
  } = params;

  return useQuery({
    queryKey: ["catalog-search", typeCode, query, parentCode, limit, offset],
    queryFn: async (): Promise<CatalogSearchResult> => {
      const result = await catalogRepository.search(typeCode, {
        query: query?.trim() || "",
        parentCode,
        limit,
        offset,
      });

      return {
        items: result.items,
        total: result.total,
      };
    },
    // Solo habilitar si:
    // - includeInactive es true (controla si el hook está "activo")
    // - query tiene al menos 1 caracter O offset > 0 (paginación inicial)
    enabled:
      enabledParam &&
      includeInactive &&
      (query.length >= 1 || offset > 0 || query === " "),
    staleTime: 30_000, // 30 segundos
    gcTime: 5 * 60_000, // 5 minutos
    placeholderData: (previousData) => previousData,
  });
}

// ============================================================================
// HOOK: useCatalogItem (para obtener un item específico)
// ============================================================================

/**
 * Hook para obtener un item específico de catálogo por su código.
 * Útil para mostrar el nombre de un código ya seleccionado.
 *
 * @example
 * const { data: municipio } = useCatalogItem("sat_municipio", "JAL-001");
 */
export function useCatalogItem(
  typeCode: CatalogTypeCodeValue,
  code: string | undefined | null,
) {
  return useQuery({
    queryKey: ["catalog-item", typeCode, code ?? ""],
    queryFn: async (): Promise<CatalogItem | null> => {
      if (code == null || code === "") return null;
      return catalogRepository.findByCode(typeCode, code);
    },
    enabled: code != null && code !== "",
    staleTime: 10 * 60_000, // 10 minutos
    gcTime: 60 * 60_000, // 1 hora
  });
}

// ============================================================================
// HOOK: useCatalogChildren (para obtener los hijos de un item (catálogos jerárquicos))
// ============================================================================

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

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  useCatalogSearch,
  useCatalogOptions,
  useCatalogItem,
  useCatalogItems,
  useCatalogChildren,
};
