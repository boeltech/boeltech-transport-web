/**
 * useDriver Hook
 * Clean Architecture - Application Layer (Hooks)
 *
 * Hook para obtener un conductor por ID con React Query.
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { type Driver, driverQueryKeys } from "../../domain";
import { createGetDriverUseCase } from "../index";
import { createDriverRepository } from "../../infrastructure";

// ============================================================================
// REPOSITORY INSTANCE
// ============================================================================

const driverRepository = createDriverRepository();

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para obtener un conductor por ID
 *
 * @param id - ID del conductor
 * @param options - Opciones adicionales de React Query
 * @returns Query result con el conductor
 *
 * @example
 * const { data: driver, isLoading } = useDriver(driverId);
 */
export function useDriver(
  id: string,
  options?: Omit<UseQueryOptions<Driver | null>, "queryKey" | "queryFn">,
) {
  const getDriverUseCase = createGetDriverUseCase(driverRepository);

  return useQuery({
    queryKey: driverQueryKeys.detail(id),
    queryFn: async () => {
      const result = await getDriverUseCase.execute(id);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!id,
    staleTime: 30000, // 30 segundos
    ...options,
  });
}
