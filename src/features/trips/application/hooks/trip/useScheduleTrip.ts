import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { tripRepository } from "@features/trips/infrastructure";
import {
  createScheduleTripUseCase,
  type ScheduleTripResult,
} from "../../useCases";
import { tripQueryKeys, TripStatus, type Trip } from "@features/trips/domain";
import { invalidateTripAssignmentResources } from "./invalidateTripAssignmentResources";
import { invalidateTripDetailSurface } from "./invalidateTripDetailSurface";

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
 * Soft-overlap warnings (0071 E2) se propagan en el resultado para que el CTA
 * muestre toasts; el hook no toastea.
 */
export function useScheduleTrip(
  options?: UseMutationOptions<ScheduleTripResult, TripActionError, string>,
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
    onSuccess: async (result, tripId, onMutateResult, context) => {
      const trip = result.trip;
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
      await invalidateTripDetailSurface(queryClient, tripId, {
        status: TripStatus.SCHEDULED,
      });
      await invalidateTripAssignmentResources(queryClient);
      await userOnSuccess?.(result, tripId, onMutateResult, context);
    },
    onError: (error, tripId, onMutateResult, context) => {
      userOnError?.(error, tripId, onMutateResult, context);
    },
    onSettled: (data, error, tripId, onMutateResult, context) => {
      userOnSettled?.(data, error, tripId, onMutateResult, context);
    },
  });
}
