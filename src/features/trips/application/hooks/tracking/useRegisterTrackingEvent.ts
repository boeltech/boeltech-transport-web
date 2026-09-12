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

export type TrackingApiWarning = {
  code: string;
  message: string;
};

/** Resultado de registrar un evento (incluye soft-warns ADR-0093). */
export type RegisterTrackingEventResult = {
  event: TrackingEvent;
  warnings?: TrackingApiWarning[];
};

/**
 * Importante: no poner `...options` después de `onSuccess` — el caller
 * (toast) sobrescribiría la invalidación de cache.
 */
export function useRegisterTrackingEvent(
  options?: UseMutationOptions<
    RegisterTrackingEventResult,
    Error,
    RegisterTrackingEventVariables
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
    mutationFn: async ({ tripId, event }) => {
      const result = await trackingRepository.createEvent(tripId, event);
      return {
        event: result.data,
        ...(result.warnings && result.warnings.length > 0
          ? { warnings: result.warnings }
          : {}),
      };
    },
    onSuccess: async (data, variables, onMutateResult, context) => {
      const patch = buildTripDetailPatchFromTrackingEvent(variables.event);
      await refetchTripTrackingViews(queryClient, variables.tripId, patch);
      await invalidateTripAssignmentResources(queryClient);
      await queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });
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
