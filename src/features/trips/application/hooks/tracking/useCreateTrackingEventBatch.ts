import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { invalidateDashboardLiveQueries } from "@features/dashboard/application/invalidateDashboardLiveQueries";
import { settlementsQueryKeys } from "@features/settlements/application/settlementsQueryKeys";
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

function batchAffectsSettlements(events: CreateTrackingEventInput[]): boolean {
  return events.some(
    (event) =>
      event.eventType === "trip_arrived" ||
      event.eventType === "false_trip_declared",
  );
}

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
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.opsDaySummary(),
        refetchType: "active",
      });
      await queryClient.invalidateQueries({
        queryKey: [...tripQueryKeys.all, "invoiceable-summary"],
        refetchType: "active",
      });
      if (batchAffectsSettlements(variables.events)) {
        await queryClient.invalidateQueries({
          queryKey: settlementsQueryKeys.workbench(),
          refetchType: "active",
        });
      }
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
