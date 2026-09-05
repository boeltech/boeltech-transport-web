import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

import {
  tripQueryKeys,
} from "@features/trips/domain";
import { createGetTripsUseCase } from "@features/trips/application";
import { tripRepository } from "@features/trips/infrastructure";

import {
  fetchAllActiveAssignmentTrips,
  type FetchAllActiveAssignmentTripsResult,
} from "./fetchActiveAssignmentTrips";

/**
 * All scheduled/in_progress trips for assignment busy detection (client-side pagination).
 */
export function useActiveAssignmentTripsForBusy(
  options?: Omit<
    UseQueryOptions<FetchAllActiveAssignmentTripsResult, Error>,
    "queryKey" | "queryFn"
  >,
) {
  const getTripsUseCase = createGetTripsUseCase(tripRepository);

  return useQuery({
    queryKey: tripQueryKeys.activeAssignmentBusy(),
    queryFn: async () => {
      return fetchAllActiveAssignmentTrips(async (params) => {
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
