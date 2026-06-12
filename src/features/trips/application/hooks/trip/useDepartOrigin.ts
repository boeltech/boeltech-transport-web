import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  tripQueryKeys,
  type TrackingEvent,
} from "@features/trips/domain";
import { trackingRepository } from "@features/trips/infrastructure";

import { invalidateTripAssignmentResources } from "./invalidateTripAssignmentResources";
import { refetchTripTrackingViews } from "../tracking/syncTripDetailFromTimeline";

export interface DepartOriginVariables {
  tripId: string;
  occurredAt: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  idempotencyKey?: string;
}

/**
 * Emite trip_departed (salida fiscal de origen) tras llegada y carga en origen.
 */
export function useDepartOrigin(
  options?: UseMutationOptions<TrackingEvent, Error, DepartOriginVariables>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tripId,
      occurredAt,
      latitude,
      longitude,
      notes,
      idempotencyKey,
    }) => {
      const result = await trackingRepository.createEvent(tripId, {
        eventType: "trip_departed",
        occurredAt,
        latitude,
        longitude,
        notes,
        idempotencyKey,
        capturedVia: "web",
      });
      return result.data;
    },
    ...options,
    onSuccess: async (data, variables, onMutateResult, context) => {
      await refetchTripTrackingViews(queryClient, variables.tripId);
      await invalidateTripAssignmentResources(queryClient);
      await queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
