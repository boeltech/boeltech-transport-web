import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  tripQueryKeys,
  type CloseTrackingIncidentInput,
  type CloseTrackingIncidentResult,
} from "@features/trips/domain";
import { trackingRepository } from "@features/trips/infrastructure";

import { refetchTripTrackingViews } from "./syncTripDetailFromTimeline";

interface CloseTrackingIncidentVariables {
  tripId: string;
  input: CloseTrackingIncidentInput;
}

/**
 * Cierre operativo de incidente (T4): flag false + note.
 * No inventa incident_resolved. Invalida timeline al éxito.
 *
 * Importante: no poner `...options` después de `onSuccess` — el caller
 * (toast) sobrescribiría la invalidación de cache.
 */
export function useCloseTrackingIncident(
  options?: UseMutationOptions<
    CloseTrackingIncidentResult,
    Error,
    CloseTrackingIncidentVariables
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
    mutationFn: async ({ tripId, input }) => {
      const result = await trackingRepository.closeIncident(tripId, input);
      return result.data;
    },
    onSuccess: async (data, variables, onMutateResult, context) => {
      await refetchTripTrackingViews(queryClient, variables.tripId);
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
