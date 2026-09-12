import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

import { tripQueryKeys } from "@features/trips/domain";
import { createGetTripsUseCase } from "@features/trips/application";
import { tripRepository } from "@features/trips/infrastructure";

import {
  fetchAllDraftHoldAssignmentTrips,
  type FetchAllDraftHoldAssignmentTripsResult,
} from "./fetchDraftHoldAssignmentTrips";

/**
 * Draft (Reserva) trips for soft-hold signals on scheduled/in_progress reassign.
 * Does not feed hard busy detection (PD5).
 */
export function useDraftHoldAssignmentTripsForSoft(
  options?: Omit<
    UseQueryOptions<FetchAllDraftHoldAssignmentTripsResult, Error>,
    "queryKey" | "queryFn"
  >,
) {
  const getTripsUseCase = createGetTripsUseCase(tripRepository);

  return useQuery({
    queryKey: tripQueryKeys.draftHoldAssignmentSoft(),
    queryFn: async () => {
      return fetchAllDraftHoldAssignmentTrips(async (params) => {
        const result = await getTripsUseCase.execute(params);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      });
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
    ...options,
  });
}
