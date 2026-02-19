/**
 * useDeleteDriver Hook
 * Clean Architecture - Application Layer (Hooks)
 *
 * Hook para eliminar un conductor con React Query Mutation.
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { MappedActionResult } from "@shared/api";
import { driverQueryKeys } from "../../domain";
import { createDeleteDriverUseCase } from "../useCases";
import { createDriverRepository } from "../../infrastructure";

// ============================================================================
// REPOSITORY INSTANCE
// ============================================================================

const driverRepository = createDriverRepository();

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para eliminar un conductor
 *
 * @param options - Opciones de mutación (onSuccess, onError, etc.)
 * @returns Mutation result
 *
 * @example
 * const deleteDriver = useDeleteDriver({
 *   onSuccess: () => {
 *     toast({ title: 'Conductor eliminado' });
 *     navigate('/drivers');
 *   }
 * });
 *
 * deleteDriver.mutate(driverId);
 */
export function useDeleteDriver(
  options?: Omit<
    UseMutationOptions<MappedActionResult, Error, string>,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  const deleteDriverUseCase = createDeleteDriverUseCase(driverRepository);

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteDriverUseCase.execute(id);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: (data, variables, context) => {
      // Invalidar detalle del conductor eliminado
      queryClient.invalidateQueries({
        queryKey: driverQueryKeys.detail(variables),
      });
      // Invalidar lista de conductores
      queryClient.invalidateQueries({ queryKey: driverQueryKeys.lists() });
      // Invalidar lista de disponibles
      queryClient.invalidateQueries({ queryKey: driverQueryKeys.available() });
      // Llamar callback personalizado
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}
