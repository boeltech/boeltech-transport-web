import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";

import { TripStatus, tripQueryKeys } from "@features/trips/domain";
import { useStartTrip } from "./useStartTrip";

const startTrip = vi.fn();
const findById = vi.fn();
const invalidateTripAssignmentResources = vi.fn().mockResolvedValue(undefined);
const refetchTripTrackingViews = vi.fn().mockResolvedValue(undefined);
const invalidateDashboardLiveQueries = vi.fn();

vi.mock("@features/trips/infrastructure", () => ({
  trackingRepository: {
    startTrip: (...args: unknown[]) => startTrip(...args),
  },
  tripRepository: {
    findById: (...args: unknown[]) => findById(...args),
  },
}));

vi.mock("./invalidateTripAssignmentResources", () => ({
  invalidateTripAssignmentResources: (...args: unknown[]) =>
    invalidateTripAssignmentResources(...args),
}));

vi.mock("../tracking/syncTripDetailFromTimeline", () => ({
  refetchTripTrackingViews: (...args: unknown[]) =>
    refetchTripTrackingViews(...args),
}));

vi.mock("@features/dashboard/application/invalidateDashboardLiveQueries", () => ({
  invalidateDashboardLiveQueries: (...args: unknown[]) =>
    invalidateDashboardLiveQueries(...args),
}));

describe("useStartTrip cache callbacks", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    startTrip.mockResolvedValue(undefined);
    findById.mockResolvedValue({
      data: {
        id: "trip-1",
        status: TripStatus.IN_PROGRESS,
        mileage: { start: 100 },
        actualDeparture: "2026-06-01T10:00:00.000Z",
      },
    });
  });

  it("invalidates fleetSnapshot after start (CP freeze)", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    function wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(() => useStartTrip(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: "trip-1", mileage: 100 });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: tripQueryKeys.fleetSnapshot("trip-1"),
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: tripQueryKeys.lists(),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: tripQueryKeys.opsDaySummary(),
      refetchType: "active",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [...tripQueryKeys.all, "invoiceable-summary"],
      refetchType: "active",
    });
  });
});
