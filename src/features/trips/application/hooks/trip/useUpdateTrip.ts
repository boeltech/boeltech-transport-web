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
 * Merge de detalle tras PUT.
 * El API suele devolver payload plano sin relaciones; si el body reemplazó `stops`
 * (wizard estructural), no conservar stops/cargos/expenses previos (IDs stale).
 */
export function mergeTripDetailAfterUpdate(
  previous: Trip | undefined,
  updated: Trip,
  options?: { structuralReplace?: boolean },
): Trip {
  if (!previous) return updated;

  const structuralReplace = options?.structuralReplace === true;

  return {
    ...previous,
    ...updated,
    vehicle: updated.vehicle ?? previous.vehicle,
    driver: updated.driver ?? previous.driver,
    client: updated.client ?? previous.client,
    internalStaff:
      updated.internalStaff && updated.internalStaff.length > 0
        ? updated.internalStaff
        : previous.internalStaff,
    stops: structuralReplace
      ? updated.stops
      : (updated.stops ?? previous.stops),
    cargos: structuralReplace
      ? updated.cargos
      : (updated.cargos ?? previous.cargos),
    expenses: structuralReplace
      ? updated.expenses
      : (updated.expenses ?? previous.expenses),
    statusHistory: updated.statusHistory ?? previous.statusHistory,
    profitability: updated.profitability ?? previous.profitability,
  };
}

/**
 * Hook para actualizar viaje.
 * Cache: merge en detalle + invalidación de detail (cubre cargos) y listados.
 * Necesario porque PUT no anida stops/cargos y staleTime del detail es ~5 min.
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

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const result = await updateTripUseCase.execute(id, data);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: async (updatedTrip, variables, onMutateResult, context) => {
      const { id, data } = variables;
      const structuralReplace = data.stops !== undefined;

      queryClient.setQueryData<Trip>(tripQueryKeys.detail(id), (previous) =>
        mergeTripDetailAfterUpdate(previous, updatedTrip, { structuralReplace }),
      );
      await queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });
      // Prefijo detail(id) también marca stale `…/cargos` (RQ v5 partial match).
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.detail(id),
      });
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
