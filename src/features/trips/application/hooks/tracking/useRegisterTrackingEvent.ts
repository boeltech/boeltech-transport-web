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
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({
        queryKey: tripQueryKeys.timeline(variables.tripId),
      });
      queryClient.invalidateQueries({
        queryKey: tripQueryKeys.detail(variables.tripId),
      });
      queryClient.invalidateQueries({
        queryKey: tripQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
    ...options,
  });
}
