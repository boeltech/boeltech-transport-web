import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";

import { tripQueryKeys } from "@features/trips/domain";
import { useCloseTrackingIncident } from "./useCloseTrackingIncident";

const closeIncident = vi.fn();
const refetchTripTrackingViews = vi.fn().mockResolvedValue(undefined);

vi.mock("@features/trips/infrastructure", () => ({
  trackingRepository: {
    closeIncident: (...args: unknown[]) => closeIncident(...args),
  },
}));

vi.mock("./syncTripDetailFromTimeline", () => ({
  refetchTripTrackingViews: (...args: unknown[]) =>
    refetchTripTrackingViews(...args),
}));

describe("useCloseTrackingIncident cache callbacks", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    closeIncident.mockResolvedValue({
      data: {
        hasOpenIncident: false,
        noteEvent: {
          id: "note-1",
          tripId: "trip-1",
          eventType: "note",
        },
      },
    });
  });

  it("refresca timeline aunque el caller pase onSuccess (no pisa cache sync)", async () => {
    const userOnSuccess = vi.fn();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    function wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(
      () => useCloseTrackingIncident({ onSuccess: userOnSuccess }),
      { wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync({
        tripId: "trip-1",
        input: {
          notes: "Unidad reanudó ruta tras asistencia",
          idempotencyKey: "11111111-1111-4111-8111-111111111111",
        },
      });
    });

    await waitFor(() => {
      expect(userOnSuccess).toHaveBeenCalled();
    });

    expect(closeIncident).toHaveBeenCalledWith("trip-1", {
      notes: "Unidad reanudó ruta tras asistencia",
      idempotencyKey: "11111111-1111-4111-8111-111111111111",
    });
    expect(refetchTripTrackingViews).toHaveBeenCalledWith(
      queryClient,
      "trip-1",
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: tripQueryKeys.lists(),
    });
  });
});
