import {
  useQueries,
  type QueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { createGetTripByIdUseCase } from "@features/trips/application";
import { tripRepository } from "@features/trips/infrastructure";
import { tripQueryKeys, type Trip, type TripStop } from "@features/trips/domain";

const getTripByIdUseCase = createGetTripByIdUseCase(tripRepository);

const TRIP_DETAIL_STALE_MS = 1000 * 60 * 5;

export async function fetchTripDetailForSubstitution(tripId: string): Promise<Trip> {
  const result = await getTripByIdUseCase.execute(tripId);
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return result.data;
}

export function tripDetailQueryOptions(
  tripId: string,
): Pick<UseQueryOptions<Trip>, "queryKey" | "queryFn" | "staleTime"> {
  return {
    queryKey: tripQueryKeys.detail(tripId),
    queryFn: () => fetchTripDetailForSubstitution(tripId),
    staleTime: TRIP_DETAIL_STALE_MS,
  };
}

export async function prefetchInvoiceLinkedTrips(
  queryClient: QueryClient,
  tripIds: string[],
): Promise<void> {
  await Promise.all(
    tripIds.map((tripId) =>
      queryClient.fetchQuery({
        ...tripDetailQueryOptions(tripId),
      }),
    ),
  );
}

export function buildStopsByIdFromCache(
  queryClient: QueryClient,
  tripIds: string[],
): Map<string, TripStop> {
  const stopsById = new Map<string, TripStop>();
  for (const tripId of tripIds) {
    const trip = queryClient.getQueryData<Trip>(tripQueryKeys.detail(tripId));
    for (const stop of trip?.stops ?? []) {
      stopsById.set(stop.id, stop);
    }
  }
  return stopsById;
}

export function findMissingTripCorrectionStopIds(
  entries: ReadonlyArray<{ stop_id: string }>,
  stopsById: Map<string, TripStop>,
): string[] {
  return entries
    .filter((entry) => !stopsById.has(entry.stop_id))
    .map((entry) => entry.stop_id);
}

export function useInvoiceLinkedTripsLoading(
  tripIds: string[],
  enabled: boolean,
): boolean {
  const queries = useQueries({
    queries: tripIds.map((tripId) => ({
      ...tripDetailQueryOptions(tripId),
      enabled: enabled && !!tripId,
    })),
  });

  return queries.some((query) => query.isLoading);
}
