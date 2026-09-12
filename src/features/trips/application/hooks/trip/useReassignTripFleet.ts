import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  tripQueryKeys,
  type CreateTripWarning,
  type Trip,
} from "@features/trips/domain";
import { tripsApi } from "@features/trips/infrastructure/api/tripsApi";
import { invalidateTripAssignmentResources } from "./invalidateTripAssignmentResources";

export type ReassignTripFleetInput = {
  vehicleId?: string;
  driverId?: string;
  trailers?: Array<{ trailerId: string; position: 1 | 2 }>;
  internalStaff?: Array<{
    employeeId: string;
    internalRole: "secondary_driver" | "helper";
    isPaymentResponsible?: boolean;
    paymentNotes?: string | null;
  }>;
  allowExpiredDocs?: boolean;
};

export type ReassignTripFleetResult = {
  trip: Trip;
  warnings?: CreateTripWarning[];
};

export function useReassignTripFleet(
  tripId: string,
  options?: UseMutationOptions<
    ReassignTripFleetResult,
    Error,
    ReassignTripFleetInput
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
    retry: 0,
    mutationFn: (data: ReassignTripFleetInput) =>
      tripsApi.patchFleet(tripId, data),
    onSuccess: async (result, variables, onMutateResult, context) => {
      const trip = result.trip;
      queryClient.setQueryData<Trip>(tripQueryKeys.detail(tripId), (previous) => {
        if (!previous) return trip;
        return {
          ...previous,
          ...trip,
          requiresFiscalAttention:
            trip.requiresFiscalAttention ?? previous.requiresFiscalAttention,
        };
      });
      await invalidateTripAssignmentResources(queryClient);
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.detail(tripId),
      });
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.lists(),
      });
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.activeAssignmentBusy(),
      });
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.draftHoldAssignmentSoft(),
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
