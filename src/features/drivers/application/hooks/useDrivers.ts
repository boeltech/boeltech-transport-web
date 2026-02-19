/**
 * useDrivers Hook
 * Clean Architecture - Application Layer (Hooks)
 *
 * Hook para obtener lista de conductores con React Query.
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { MappedPaginatedResult } from "@shared/api";
import {
  type DriverListItem,
  type DriverQueryParams,
  driverQueryKeys,
} from "../../domain";
import { createGetDriversUseCase } from "../useCases";
import { createDriverRepository } from "../../infrastructure";

// ============================================================================
// REPOSITORY INSTANCE
// ============================================================================

const driverRepository = createDriverRepository();

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para obtener lista de conductores
 *
 * @param params - Parámetros de consulta (filtros, paginación, ordenamiento)
 * @param options - Opciones adicionales de React Query
 * @returns Query result con lista de conductores paginada
 *
 * @example
 * const { data, isLoading } = useDrivers({
 *   page: 1,
 *   limit: 10,
 *   filters: { status: 'available' }
 * });
 */
export function useDrivers(
  params?: DriverQueryParams,
  options?: Omit<
    UseQueryOptions<MappedPaginatedResult<DriverListItem>>,
    "queryKey" | "queryFn"
  >,
) {
  const getDriversUseCase = createGetDriversUseCase(driverRepository);

  return useQuery({
    queryKey: driverQueryKeys.list(params),
    queryFn: async () => {
      const result = await getDriversUseCase.execute(params);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    ...options,
  });
}
