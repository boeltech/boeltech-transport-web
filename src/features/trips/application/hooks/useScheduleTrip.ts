import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { createTripRepository } from "@features/trips/infrastructure";
import { tripQueryKeys } from "@features/trips/domain/entities";
import { mapBackendError } from "@shared/utils/errorMapper";

// ============================================================================
// TYPES
// ============================================================================

interface ScheduleTripResponse {
  id: string;
  status: string;
}

// ============================================================================
// REPOSITORY
// ============================================================================

const tripRepository = createTripRepository();

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
 */
export function useScheduleTrip(
  options?: UseMutationOptions<ScheduleTripResponse, TripActionError, string>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tripId: string) => {
      try {
        const result = await tripRepository.updateStatus(tripId, {
          status: "scheduled",
        });
        return result;
      } catch (error) {
        const mapped = mapBackendError(error);
        throw new TripActionError(
          mapped.code,
          mapped.message,
          mapped.originalMessage,
        );
      }
    },
    onSuccess: (data, tripId) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.detail(tripId) });
    },
    ...options,
  });
}
