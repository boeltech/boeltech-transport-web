import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  tripQueryKeys,
  type Trip,
  type UpdateTripInput,
} from "@features/trips/domain";
import { createUpdateTripUseCase } from "@features/trips/application";
import { tripRepository } from "@features/trips/infrastructure";

/**
 * Hook para actualizar viaje.
 * Cache: merge optimista en detalle vía setQueryData; invalidación solo de listados.
 */
export function useUpdateTrip(
  options?: UseMutationOptions<
    Trip,
    Error,
    { id: string; data: UpdateTripInput }
  >,
) {
  const queryClient = useQueryClient();
  const updateTripUseCase = createUpdateTripUseCase(tripRepository);
  const {
    onSuccess: onSuccessExternal,
    onError: onErrorExternal,
    onSettled: onSettledExternal,
    ...restOptions
  } = options ?? {};

  function mergeTripDetail(previous: Trip | undefined, updated: Trip): Trip {
    if (!previous) return updated;
    return {
      ...previous,
      ...updated,
      // El PATCH puede devolver payload parcial sin relaciones del detalle.
      vehicle: updated.vehicle ?? previous.vehicle,
      driver: updated.driver ?? previous.driver,
      client: updated.client ?? previous.client,
      internalStaff:
        updated.internalStaff && updated.internalStaff.length > 0
          ? updated.internalStaff
          : previous.internalStaff,
      stops: updated.stops ?? previous.stops,
      cargos: updated.cargos ?? previous.cargos,
      expenses: updated.expenses ?? previous.expenses,
      statusHistory: updated.statusHistory ?? previous.statusHistory,
      profitability: updated.profitability ?? previous.profitability,
    };
  }

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const result = await updateTripUseCase.execute(id, data);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: async (updatedTrip, variables, onMutateResult, context) => {
      const { id } = variables;
      queryClient.setQueryData<Trip>(tripQueryKeys.detail(id), (previous) =>
        mergeTripDetail(previous, updatedTrip),
      );
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });
      await onSuccessExternal?.(updatedTrip, variables, onMutateResult, context);
    },
    onError: async (error, variables, onMutateResult, context) => {
      await onErrorExternal?.(error, variables, onMutateResult, context);
    },
    onSettled: async (data, error, variables, onMutateResult, context) => {
      await onSettledExternal?.(data, error, variables, onMutateResult, context);
    },
    ...restOptions,
  });
}
