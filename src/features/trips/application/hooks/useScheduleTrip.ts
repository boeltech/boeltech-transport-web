import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { createTripRepository } from "@features/trips/infrastructure";
import { tripQueryKeys, type Trip } from "@features/trips/domain/entities";
import { createScheduleTripUseCase } from "@features/trips/application/useCases/trips";

// ============================================================================
// TYPES
// ============================================================================

// ============================================================================
// USE CASE
// ============================================================================

const tripRepository = createTripRepository();
const scheduleTripUseCase = createScheduleTripUseCase(tripRepository);

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
 * Hook para programar un viaje (cambiar de draft → scheduled)
 * Utiliza Clean Architecture a través del caso de uso ScheduleTripUseCase
 */
export function useScheduleTrip(
  options?: UseMutationOptions<Trip, TripActionError, string>,
) {
  const queryClient = useQueryClient();

  return useMutation({
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
    onSuccess: (data, tripId) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.detail(tripId) });
    },
    ...options,
  });
}
