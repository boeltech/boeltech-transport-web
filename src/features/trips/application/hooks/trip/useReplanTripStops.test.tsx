import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";

import {
  tripQueryKeys,
  type ReplanPendingStopInput,
  type TrackingTimeline,
  type Trip,
  type TripStop,
} from "@features/trips/domain";
import { useReplanTripStops } from "./useReplanTripStops";

const replanStops = vi.fn();

vi.mock("@features/trips/infrastructure/api/tripsApi", () => ({
  tripsApi: {
    replanStops: (...args: unknown[]) => replanStops(...args),
  },
}));

const TRIP_ID = "trip-1";

describe("useReplanTripStops cache", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  it("patches detail and timeline.stops from mutation response before invalidate", async () => {
    const staleStop = {
      id: "stop-dest",
      locationName: "Viejo",
      street: "Calle Vieja",
      city: "CDMX",
    } as unknown as TripStop;
    const freshStop = {
      id: "stop-dest",
      locationName: "Nuevo",
      street: "Calle Nueva",
      city: "Monterrey",
    } as unknown as TripStop;

    const previousTrip = {
      id: TRIP_ID,
      status: "in_progress",
      stops: [staleStop],
    } as unknown as Trip;

    const response = {
      id: TRIP_ID,
      status: "in_progress",
      stops: [freshStop],
      requiresFiscalAttention: true,
    } as unknown as Trip;

    const previousTimeline = {
      trip: { id: TRIP_ID, status: "in_progress" },
      progress: { percentComplete: 10 },
      stops: [staleStop],
      events: [],
      statusHistory: [],
      map: { routeGeojson: null, lastKnownPosition: null },
    } as unknown as TrackingTimeline;

    queryClient.setQueryData(tripQueryKeys.detail(TRIP_ID), previousTrip);
    queryClient.setQueryData(tripQueryKeys.timeline(TRIP_ID), previousTimeline);

    // Refetch lento: el parche optimista debe verse antes de que complete invalidate.
    replanStops.mockImplementation(async () => response);
    const invalidateSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockImplementation(async () => undefined);

    function wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(() => useReplanTripStops(TRIP_ID), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync([] as ReplanPendingStopInput[]);
    });

    await waitFor(() => {
      expect(replanStops).toHaveBeenCalled();
    });

    const cachedTrip = queryClient.getQueryData<Trip>(
      tripQueryKeys.detail(TRIP_ID),
    );
    expect(cachedTrip?.stops?.[0]?.street).toBe("Calle Nueva");
    expect(cachedTrip?.requiresFiscalAttention).toBe(true);

    const cachedTimeline = queryClient.getQueryData<TrackingTimeline>(
      tripQueryKeys.timeline(TRIP_ID),
    );
    expect(cachedTimeline?.stops[0]?.street).toBe("Calle Nueva");
    expect(cachedTimeline?.stops[0]?.locationName).toBe("Nuevo");

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: tripQueryKeys.timeline(TRIP_ID),
    });
  });
});
