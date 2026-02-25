/**
 * useUpdateDriverStatus Hook
 * Clean Architecture - Application Layer (Hooks)
 *
 * Hook para cambiar el estado de un conductor con React Query Mutation.
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  type Driver,
  type UpdateDriverStatusDTO,
  driverQueryKeys,
} from "../../domain";
import { createUpdateDriverStatusUseCase } from "../index";
import { createDriverRepository } from "../../infrastructure";

// ============================================================================
// TYPES
// ============================================================================

interface UpdateStatusVariables {
  id: string;
  data: UpdateDriverStatusDTO;
}

// ============================================================================
// REPOSITORY INSTANCE
// ============================================================================

const driverRepository = createDriverRepository();

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para cambiar el estado de un conductor
 *
 * @param options - Opciones de mutación (onSuccess, onError, etc.)
 * @returns Mutation result
 *
 * @example
 * const updateStatus = useUpdateDriverStatus({
 *   onSuccess: () => {
 *     toast({ title: 'Estado actualizado' });
 *   }
 * });
 *
 * updateStatus.mutate({
 *   id: driverId,
 *   data: { status: 'resting', reason: 'Descanso obligatorio' }
 * });
 */
export function useUpdateDriverStatus(
  options?: Omit<
    UseMutationOptions<Driver, Error, UpdateStatusVariables>,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  const updateStatusUseCase = createUpdateDriverStatusUseCase(driverRepository);

  return useMutation({
    mutationFn: async ({ id, data }: UpdateStatusVariables) => {
      const result = await updateStatusUseCase.execute(id, data);
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
      // Invalidar lista de disponibles (el estado afecta disponibilidad)
      queryClient.invalidateQueries({ queryKey: driverQueryKeys.available() });
      // Llamar callback personalizado
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}
