import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { tripRepository } from "@features/trips/infrastructure";
import { createScheduleTripUseCase } from "../../useCases";
import { tripQueryKeys, type Trip } from "@features/trips/domain";

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
  const scheduleTripUseCase = createScheduleTripUseCase(tripRepository);

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
    onSuccess: (_data, tripId) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.detail(tripId) });
    },
    ...options,
  });
}
