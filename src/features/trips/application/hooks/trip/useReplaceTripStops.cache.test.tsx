import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";

import { tripQueryKeys, type CreateStopInput, type Trip } from "@features/trips/domain";
import { useReplaceTripStops } from "./useReplaceTripStops";

const replaceStops = vi.fn();

vi.mock("@features/trips/infrastructure/api/tripsApi", () => ({
  tripsApi: {
    replaceStops: (...args: unknown[]) => replaceStops(...args),
  },
}));

const TRIP_ID = "trip-1";

describe("useReplaceTripStops cache", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  it("writes response cities into detail cache and invalidates lists", async () => {
    const previous = {
      id: TRIP_ID,
      tripCode: "T-001",
      originCity: "México",
      destinationCity: "Monterrey",
      stops: [],
    } as unknown as Trip;

    const response = {
      id: TRIP_ID,
      tripCode: "T-001",
      originCity: "Almacén Tecnológico de Monterrey",
      destinationCity: "Bodega, SLP",
      stops: [{ id: "s1" }, { id: "s2" }],
    } as unknown as Trip;

    queryClient.setQueryData(tripQueryKeys.detail(TRIP_ID), previous);
    replaceStops.mockResolvedValue(response);

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    function wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(() => useReplaceTripStops(TRIP_ID), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync([] as CreateStopInput[]);
    });

    await waitFor(() => {
      expect(replaceStops).toHaveBeenCalled();
    });

    const cached = queryClient.getQueryData<Trip>(tripQueryKeys.detail(TRIP_ID));
    expect(cached?.originCity).toBe("Almacén Tecnológico de Monterrey");
    expect(cached?.destinationCity).toBe("Bodega, SLP");

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: tripQueryKeys.lists(),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: tripQueryKeys.detail(TRIP_ID),
    });
  });
});
