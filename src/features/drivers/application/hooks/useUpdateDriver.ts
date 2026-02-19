/**
 * useUpdateDriver Hook
 * Clean Architecture - Application Layer (Hooks)
 *
 * Hook para actualizar un conductor con React Query Mutation.
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  type Driver,
  type UpdateDriverDTO,
  driverQueryKeys,
} from "../../domain";
import { createUpdateDriverUseCase } from "../useCases";
import { createDriverRepository } from "../../infrastructure";

// ============================================================================
// TYPES
// ============================================================================

interface UpdateDriverVariables {
  id: string;
  data: UpdateDriverDTO;
}

// ============================================================================
// REPOSITORY INSTANCE
// ============================================================================

const driverRepository = createDriverRepository();

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para actualizar un conductor
 *
 * @param options - Opciones de mutación (onSuccess, onError, etc.)
 * @returns Mutation result
 *
 * @example
 * const updateDriver = useUpdateDriver({
 *   onSuccess: () => {
 *     toast({ title: 'Conductor actualizado' });
 *   }
 * });
 *
 * updateDriver.mutate({ id: driverId, data: updateData });
 */
export function useUpdateDriver(
  options?: Omit<
    UseMutationOptions<Driver, Error, UpdateDriverVariables>,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  const updateDriverUseCase = createUpdateDriverUseCase(driverRepository);

  return useMutation({
    mutationFn: async ({ id, data }: UpdateDriverVariables) => {
      const result = await updateDriverUseCase.execute(id, data);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: (data, variables, context) => {
      // Invalidar detalle del conductor
      queryClient.invalidateQueries({
        queryKey: driverQueryKeys.detail(variables.id),
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
