/**
 * useCreateDriver Hook
 * Clean Architecture - Application Layer (Hooks)
 *
 * Hook para crear un conductor con React Query Mutation.
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  type Driver,
  type CreateDriverDTO,
  driverQueryKeys,
} from "../../domain";
import { createCreateDriverUseCase } from "../index";
import { createDriverRepository } from "../../infrastructure";

// ============================================================================
// REPOSITORY INSTANCE
// ============================================================================

const driverRepository = createDriverRepository();

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para crear un conductor
 *
 * @param options - Opciones de mutación (onSuccess, onError, etc.)
 * @returns Mutation result
 *
 * @example
 * const createDriver = useCreateDriver({
 *   onSuccess: (driver) => {
 *     toast({ title: 'Conductor creado' });
 *     navigate(`/drivers/${driver.id}`);
 *   },
 *   onError: (error) => {
 *     toast({ title: 'Error', description: error.message, variant: 'destructive' });
 *   }
 * });
 *
 * createDriver.mutate(driverData);
 */
export function useCreateDriver(
  options?: Omit<
    UseMutationOptions<Driver, Error, CreateDriverDTO>,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  const createDriverUseCase = createCreateDriverUseCase(driverRepository);

  return useMutation({
    mutationFn: async (data: CreateDriverDTO) => {
      const result = await createDriverUseCase.execute(data);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: (data, variables, context) => {
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
