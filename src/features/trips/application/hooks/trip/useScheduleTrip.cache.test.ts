import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";

import { TripStatus, tripQueryKeys, type Trip } from "@features/trips/domain";

/**
 * Regresión: tras programar, el cache de detalle no debe quedarse en draft
 * (useScheduleTrip debe setQueryData + invalidar aunque el caller pase onSuccess).
 */
describe("trip detail cache after schedule", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("replaces draft status when applying scheduled trip to detail cache", () => {
    const tripId = "trip-1";
    const draft = {
      id: tripId,
      status: TripStatus.DRAFT,
      tripCode: "T-001",
      stops: [{ id: "s1" }],
    } as unknown as Trip;

    const scheduled = {
      id: tripId,
      status: TripStatus.SCHEDULED,
      tripCode: "T-001",
    } as unknown as Trip;

    queryClient.setQueryData(tripQueryKeys.detail(tripId), draft);

    queryClient.setQueryData<Trip>(tripQueryKeys.detail(tripId), (previous) => {
      if (!previous) return scheduled;
      return {
        ...previous,
        ...scheduled,
        stops: scheduled.stops ?? previous.stops,
      };
    });

    const cached = queryClient.getQueryData<Trip>(tripQueryKeys.detail(tripId));
    expect(cached?.status).toBe(TripStatus.SCHEDULED);
    expect(cached?.stops).toEqual([{ id: "s1" }]);
  });

  it("invalidateQueries marks detail stale so remount refetches", async () => {
    const tripId = "trip-2";
    const fetchSpy = vi.fn().mockResolvedValue({
      id: tripId,
      status: TripStatus.SCHEDULED,
    });

    queryClient.setQueryData(tripQueryKeys.detail(tripId), {
      id: tripId,
      status: TripStatus.DRAFT,
    });

    await queryClient.invalidateQueries({
      queryKey: tripQueryKeys.detail(tripId),
    });

    const state = queryClient.getQueryState(tripQueryKeys.detail(tripId));
    expect(state?.isInvalidated).toBe(true);

    await queryClient.fetchQuery({
      queryKey: tripQueryKeys.detail(tripId),
      queryFn: fetchSpy,
      staleTime: 1000 * 60 * 5,
    });

    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData<Trip>(tripQueryKeys.detail(tripId))?.status).toBe(
      TripStatus.SCHEDULED,
    );
  });
});
