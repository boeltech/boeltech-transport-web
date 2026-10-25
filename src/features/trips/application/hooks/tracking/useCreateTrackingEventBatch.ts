import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { invalidateDashboardLiveQueries } from "@features/dashboard/application/invalidateDashboardLiveQueries";
import {
  tripQueryKeys,
  type CreateTrackingEventInput,
  type TrackingEventBatchItem,
} from "@features/trips/domain";
import { trackingRepository } from "@features/trips/infrastructure";

import { invalidateTripAssignmentResources } from "../trip/invalidateTripAssignmentResources";
import {
  buildTripDetailPatchFromTrackingEvent,
  refetchTripTrackingViews,
} from "./syncTripDetailFromTimeline";

interface CreateTrackingEventBatchVariables {
  tripId: string;
  events: CreateTrackingEventInput[];
}

export type CreateTrackingEventBatchResult = {
  items: TrackingEventBatchItem[];
  message?: string;
};

/**
 * Mutación batch atómica (T-BATCH). Invalida timeline/detalle como
 * `useRegisterTrackingEvent` / `useStartTrip`.
 *
 * Importante: no poner `...options` después de `onSuccess` — el caller
 * sobrescribiría la invalidación de cache.
 */
export function useCreateTrackingEventBatch(
  options?: UseMutationOptions<
    CreateTrackingEventBatchResult,
    Error,
    CreateTrackingEventBatchVariables
  >,
) {
  const queryClient = useQueryClient();
  const {
    onSuccess: userOnSuccess,
    onError: userOnError,
    onSettled: userOnSettled,
    ...rest
  } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: async ({ tripId, events }) => {
      const result = await trackingRepository.createEventBatch(tripId, events);
      return {
        items: result.data,
        ...(result.message ? { message: result.message } : {}),
      };
    },
    onSuccess: async (data, variables, onMutateResult, context) => {
      const patchSource =
        variables.events.find((event) => event.eventType === "trip_dispatched") ??
        variables.events[0];
      const patch = patchSource
        ? buildTripDetailPatchFromTrackingEvent(patchSource)
        : undefined;
      await refetchTripTrackingViews(queryClient, variables.tripId, patch);
      await invalidateTripAssignmentResources(queryClient);
      await queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });
      invalidateDashboardLiveQueries(queryClient);
      await userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      userOnError?.(error, variables, onMutateResult, context);
    },
    onSettled: (data, error, variables, onMutateResult, context) => {
      userOnSettled?.(data, error, variables, onMutateResult, context);
    },
  });
}
