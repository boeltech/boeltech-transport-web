import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { devRefetchIntervalFn } from "@/shared/config/devPolling";
import { tripQueryKeys, type TrackingTimeline } from "@features/trips/domain";
import { trackingRepository } from "@features/trips/infrastructure";

export function useTripTimeline(
  tripId: string,
  options?: Omit<UseQueryOptions<TrackingTimeline>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: tripQueryKeys.timeline(tripId),
    queryFn: async () => {
      const result = await trackingRepository.getTimeline(tripId);
      return result.data;
    },
    enabled: !!tripId,
    staleTime: 10_000,
    refetchInterval: devRefetchIntervalFn((query) =>
      query.state.data?.trip.status === "in_progress" ? 30_000 : false,
    ),
    ...options,
  });
}
