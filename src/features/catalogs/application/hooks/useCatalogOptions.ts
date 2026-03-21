/**
 * useCatalogOptions Hook
 * Clean Architecture - Application Layer (Hooks)
 *
 * Hook para obtener opciones de catálogo para dropdowns/selects.
 * Ideal para catálogos pequeños que se pueden cargar completos.
 *
 * @example
 * // Cargar todos los estados
 * const { data: estados } = useCatalogOptions(CatalogTypeCode.SAT_ESTADO);
 *
 * // Cargar municipios filtrados por estado
 * const { data: municipios } = useCatalogOptions(
 *   CatalogTypeCode.SAT_MUNICIPIO,
 *   { parentCode: 'JAL' }
 * );
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  type CatalogOption,
  type CatalogTypeCodeValue,
  catalogQueryKeys,
} from "../../domain";
import { catalogRepository } from "../../infrastructure";

// ============================================================================
// TYPES
// ============================================================================

export interface UseCatalogOptionsParams {
  /**
   * Código del padre para catálogos jerárquicos
   */
  parentCode?: string;
  /**
   * Si se debe habilitar la query
   */
  enabled?: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para obtener opciones de catálogo
 */
export function useCatalogOptions(
  typeCode: CatalogTypeCodeValue,
  params?: UseCatalogOptionsParams,
  options?: Omit<
    UseQueryOptions<CatalogOption[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  const { parentCode, enabled = true } = params ?? {};

  return useQuery({
    queryKey: catalogQueryKeys.optionsFiltered(typeCode, parentCode),
    queryFn: () => catalogRepository.findAllAsOptions(typeCode, parentCode),
    enabled,
    staleTime: 1000 * 60 * 30, // 30 minutos - catálogos SAT no cambian frecuentemente
    gcTime: 1000 * 60 * 60, // 1 hora en cache
    ...options,
  });
}

/**
 * Hook para obtener opciones de estados (México)
 */
export function useEstadosOptions(
  options?: Omit<
    UseQueryOptions<CatalogOption[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useCatalogOptions(
    "sat_estado" as CatalogTypeCodeValue,
    undefined,
    options,
  );
}

/**
 * Hook para obtener opciones de municipios por estado
 */
export function useMunicipiosOptions(
  estadoCode?: string,
  options?: Omit<
    UseQueryOptions<CatalogOption[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useCatalogOptions(
    "sat_municipio" as CatalogTypeCodeValue,
    { parentCode: estadoCode, enabled: !!estadoCode },
    options,
  );
}

/**
 * Hook para obtener opciones de tipos de permiso SCT
 */
export function useTipoPermisoOptions(
  options?: Omit<
    UseQueryOptions<CatalogOption[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useCatalogOptions(
    "sat_tipo_permiso" as CatalogTypeCodeValue,
    undefined,
    options,
  );
}

/**
 * Hook para obtener opciones de configuración vehicular
 */
export function useConfigAutotransporteOptions(
  options?: Omit<
    UseQueryOptions<CatalogOption[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useCatalogOptions(
    "sat_config_autotransporte" as CatalogTypeCodeValue,
    undefined,
    options,
  );
}

/**
 * Hook para obtener opciones de tipos de figura
 */
export function useTipoFiguraOptions(
  options?: Omit<
    UseQueryOptions<CatalogOption[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useCatalogOptions(
    "sat_tipo_figura" as CatalogTypeCodeValue,
    undefined,
    options,
  );
}

/**
 * Hook para obtener opciones de formas de pago
 */
export function useFormaPagoOptions(
  options?: Omit<
    UseQueryOptions<CatalogOption[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useCatalogOptions(
    "sat_forma_pago" as CatalogTypeCodeValue,
    undefined,
    options,
  );
}

/**
 * Hook para obtener opciones de métodos de pago
 */
export function useMetodoPagoOptions(
  options?: Omit<
    UseQueryOptions<CatalogOption[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useCatalogOptions(
    "sat_metodo_pago" as CatalogTypeCodeValue,
    undefined,
    options,
  );
}

/**
 * Hook para obtener opciones de usos de CFDI
 */
export function useUsoCfdiOptions(
  options?: Omit<
    UseQueryOptions<CatalogOption[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useCatalogOptions(
    "sat_uso_cfdi" as CatalogTypeCodeValue,
    undefined,
    options,
  );
}

/**
 * Hook para obtener opciones de regímenes fiscales
 */
export function useRegimenFiscalOptions(
  options?: Omit<
    UseQueryOptions<CatalogOption[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useCatalogOptions(
    "sat_regimen_fiscal" as CatalogTypeCodeValue,
    undefined,
    options,
  );
}

/**
 * Hook para obtener opciones de tipos de embalaje
 */
export function useTipoEmbalajeOptions(
  options?: Omit<
    UseQueryOptions<CatalogOption[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useCatalogOptions(
    "sat_tipo_embalaje" as CatalogTypeCodeValue,
    undefined,
    options,
  );
}
