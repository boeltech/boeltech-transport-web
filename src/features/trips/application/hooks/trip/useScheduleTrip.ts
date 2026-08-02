import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { tripRepository } from "@features/trips/infrastructure";
import { createScheduleTripUseCase } from "../../useCases";
import { tripQueryKeys, type Trip } from "@features/trips/domain";
import { invalidateTripAssignmentResources } from "./invalidateTripAssignmentResources";

// ============================================================================
// CUSTOM ERROR
// ============================================================================

export class TripActionError extends Error {
  code: string;
  originalMessage?: string;

  constructor(code: string, message: string, originalMessage?: string) {
    super(message);
    this.name = "TripActionError";
    this.code = code;
    this.originalMessage = originalMessage;
  }
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para programar un viaje (cambiar de draft → scheduled).
 *
 * Importante: no poner `...options` después de `onSuccess` — el caller
 * (p. ej. TripActions toast) sobrescribiría la sincronización de cache.
 */
export function useScheduleTrip(
  options?: UseMutationOptions<Trip, TripActionError, string>,
) {
  const queryClient = useQueryClient();
  const scheduleTripUseCase = createScheduleTripUseCase(tripRepository);

  const {
    onSuccess: userOnSuccess,
    onError: userOnError,
    onSettled: userOnSettled,
    ...rest
  } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: async (tripId: string) => {
      const result = await scheduleTripUseCase.execute(tripId);

      if (!result.success) {
        throw new TripActionError(
          result.error.code,
          result.error.message,
          result.error.message,
        );
      }

      return result.data;
    },
    onSuccess: async (trip, tripId, onMutateResult, context) => {
      // Actualizar detalle de inmediato (evita servir draft precargado con staleTime).
      queryClient.setQueryData<Trip>(tripQueryKeys.detail(tripId), (previous) => {
        if (!previous) return trip;
        return {
          ...previous,
          ...trip,
          vehicle: trip.vehicle ?? previous.vehicle,
          driver: trip.driver ?? previous.driver,
          client: trip.client ?? previous.client,
          stops: trip.stops ?? previous.stops,
          cargos: trip.cargos ?? previous.cargos,
          expenses: trip.expenses ?? previous.expenses,
          statusHistory: trip.statusHistory ?? previous.statusHistory,
          profitability: trip.profitability ?? previous.profitability,
          internalStaff:
            trip.internalStaff && trip.internalStaff.length > 0
              ? trip.internalStaff
              : previous.internalStaff,
        };
      });
      await queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.detail(tripId),
      });
      await invalidateTripAssignmentResources(queryClient);
      await userOnSuccess?.(trip, tripId, onMutateResult, context);
    },
    onError: (error, tripId, onMutateResult, context) => {
      userOnError?.(error, tripId, onMutateResult, context);
    },
    onSettled: (data, error, tripId, onMutateResult, context) => {
      userOnSettled?.(data, error, tripId, onMutateResult, context);
    },
  });
}
