/**
 * useCloneTrip — POST /trips/:tripId/clone
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { CreateTripResult } from "@features/trips/application/useCases/trip/CreateTripUseCase";
import { tripRepository } from "@features/trips/infrastructure/repositories/tripRepository";
import { tripQueryKeys, type CloneTripInput } from "@features/trips/domain";
import { invalidateTripAssignmentResources } from "./invalidateTripAssignmentResources";

export type CloneTripVariables = {
  sourceTripId: string;
  input: CloneTripInput;
};

/**
 * Clona un viaje con fechas nuevas. La whitelist DOM vive en el API.
 */
export function useCloneTrip(
  options?: UseMutationOptions<
    CreateTripResult,
    Error,
    CloneTripVariables
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
    mutationFn: ({ sourceTripId, input }: CloneTripVariables) =>
      tripRepository.clone(sourceTripId, input),

    onSuccess: async (result, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });
      await invalidateTripAssignmentResources(queryClient);

      queryClient.setQueryData(
        tripQueryKeys.detail(result.trip.id),
        result.trip,
      );
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.detail(result.trip.id),
      });
      await userOnSuccess?.(result, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      userOnError?.(error, variables, onMutateResult, context);
    },
    onSettled: (data, error, variables, onMutateResult, context) => {
      userOnSettled?.(data, error, variables, onMutateResult, context);
    },
  });
}
