import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  tripQueryKeys,
  type CreateTrackingEventInput,
  type TrackingEvent,
} from "@features/trips/domain";
import { trackingRepository } from "@features/trips/infrastructure";

import { invalidateTripAssignmentResources } from "../trip/invalidateTripAssignmentResources";
import {
  buildTripDetailPatchFromTrackingEvent,
  refetchTripTrackingViews,
} from "./syncTripDetailFromTimeline";

interface RegisterTrackingEventVariables {
  tripId: string;
  event: CreateTrackingEventInput;
}

export function useRegisterTrackingEvent(
  options?: UseMutationOptions<
    TrackingEvent,
    Error,
    RegisterTrackingEventVariables
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, event }) => {
      const result = await trackingRepository.createEvent(tripId, event);
      return result.data;
    },
    onSuccess: async (data, variables, onMutateResult, context) => {
      const patch = buildTripDetailPatchFromTrackingEvent(variables.event);
      await refetchTripTrackingViews(queryClient, variables.tripId, patch);
      await invalidateTripAssignmentResources(queryClient);
      await queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
    ...options,
  });
}
