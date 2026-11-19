import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";

import { tripQueryKeys } from "@features/trips/domain";
import { useReassignTripFleet } from "./useReassignTripFleet";

const patchFleet = vi.fn();
const invalidateTripAssignmentResources = vi.fn().mockResolvedValue(undefined);

vi.mock("@features/trips/infrastructure/api/tripsApi", () => ({
  tripsApi: {
    patchFleet: (...args: unknown[]) => patchFleet(...args),
  },
}));

vi.mock("./invalidateTripAssignmentResources", () => ({
  invalidateTripAssignmentResources: (...args: unknown[]) =>
    invalidateTripAssignmentResources(...args),
}));

describe("useReassignTripFleet cache callbacks", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    patchFleet.mockResolvedValue({
      trip: {
        id: "trip-1",
        vehicleId: "veh-2",
        driverId: "drv-2",
      },
    });
  });

  it("invalidates fleetSnapshot after fleet reassignment", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    function wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(
      () => useReassignTripFleet("trip-1"),
      { wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync({ vehicleId: "veh-2" });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: tripQueryKeys.fleetSnapshot("trip-1"),
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: tripQueryKeys.detail("trip-1"),
    });
  });
});
