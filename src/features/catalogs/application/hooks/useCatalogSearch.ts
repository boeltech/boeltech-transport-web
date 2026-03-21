/**
 * useCatalogSearch Hook
 * Clean Architecture - Application Layer (Hooks)
 *
 * Hook para buscar en catálogos grandes usando full-text search.
 * Incluye debounce automático para evitar llamadas excesivas.
 *
 * @example
 * const { data, isLoading } = useCatalogSearch(
 *   CatalogTypeCode.SAT_CLAVE_PROD_SERV_CP,
 *   { query: searchTerm, limit: 20 }
 * );
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  type CatalogItem,
  type CatalogTypeCodeValue,
  type CatalogSearchParams,
  catalogQueryKeys,
} from "../../domain";
import type { CatalogSearchResult } from "../../domain/repository";
import { catalogRepository } from "../../infrastructure";

// ============================================================================
// TYPES
// ============================================================================

export interface UseCatalogSearchParams extends CatalogSearchParams {
  /**
   * Si se debe habilitar la query
   */
  enabled?: boolean;
  /**
   * Tiempo de debounce en ms (default: 300)
   */
  debounceMs?: number;
}

export interface UseCatalogSearchResult {
  items: CatalogItem[];
  total: number;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para buscar en catálogos usando full-text search
 */
export function useCatalogSearch(
  typeCode: CatalogTypeCodeValue,
  params: UseCatalogSearchParams,
  options?: Omit<
    UseQueryOptions<CatalogSearchResult, Error>,
    "queryKey" | "queryFn"
  >,
) {
  const { enabled = true, debounceMs: _debounceMs, ...searchParams } = params;

  // Solo habilitar si hay query de al menos 2 caracteres
  const shouldEnable = enabled && searchParams.query.trim().length >= 2;

  return useQuery({
    queryKey: catalogQueryKeys.searchQuery(typeCode, searchParams),
    queryFn: () => catalogRepository.search(typeCode, searchParams),
    enabled: shouldEnable,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos en cache
    ...options,
  });
}

/**
 * Hook para buscar productos/servicios Carta Porte
 */
export function useSearchProductosServiciosCP(
  query: string,
  options?: { limit?: number; enabled?: boolean },
) {
  return useCatalogSearch("sat_clave_prod_serv_cp" as CatalogTypeCodeValue, {
    query,
    limit: options?.limit ?? 20,
    enabled: options?.enabled,
  });
}

/**
 * Hook para buscar unidades de medida SAT
 */
export function useSearchUnidadesMedida(
  query: string,
  options?: { limit?: number; enabled?: boolean },
) {
  return useCatalogSearch("sat_clave_unidad" as CatalogTypeCodeValue, {
    query,
    limit: options?.limit ?? 20,
    enabled: options?.enabled,
  });
}

/**
 * Hook para buscar materiales peligrosos
 */
export function useSearchMaterialesPeligrosos(
  query: string,
  options?: { limit?: number; enabled?: boolean },
) {
  return useCatalogSearch("sat_material_peligroso" as CatalogTypeCodeValue, {
    query,
    limit: options?.limit ?? 20,
    enabled: options?.enabled,
  });
}

/**
 * Hook para buscar colonias por municipio
 */
export function useSearchColonias(
  query: string,
  municipioCode?: string,
  options?: { limit?: number; enabled?: boolean },
) {
  return useCatalogSearch("sat_colonia" as CatalogTypeCodeValue, {
    query,
    parentCode: municipioCode,
    limit: options?.limit ?? 20,
    enabled: options?.enabled && !!municipioCode,
  });
}

/**
 * Hook para buscar localidades por municipio
 */
export function useSearchLocalidades(
  query: string,
  municipioCode?: string,
  options?: { limit?: number; enabled?: boolean },
) {
  return useCatalogSearch("sat_localidad" as CatalogTypeCodeValue, {
    query,
    parentCode: municipioCode,
    limit: options?.limit ?? 20,
    enabled: options?.enabled && !!municipioCode,
  });
}
