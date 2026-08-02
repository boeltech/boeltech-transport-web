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
import { invalidateNotificationsQueries } from "@features/notifications/application/invalidateNotificationsQueries";
import {
  type Driver,
  type UpdateDriverDTO,
  driverQueryKeys,
} from "../../domain";
import { createUpdateDriverUseCase } from "../index";
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
    onSuccess: (data, variables, onMutateResult, context) => {
      // Actualizar el cache del detalle directamente con los datos devueltos
      // Esto es inmediato y permite que la navegación sea instantánea
      queryClient.setQueryData(driverQueryKeys.detail(variables.id), data);

      // Invalidar queries en background (sin await)
      // El refetch ocurrirá cuando el usuario vuelva a necesitar estos datos
      queryClient.invalidateQueries({
        queryKey: driverQueryKeys.detail(variables.id),
      });

      queryClient.invalidateQueries({
        queryKey: driverQueryKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: driverQueryKeys.available(),
      });

      invalidateNotificationsQueries(queryClient);

      // Llamar callback personalizado inmediatamente
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: options?.onError,
    onSettled: options?.onSettled,
  });
}
