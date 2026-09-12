import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";

import { tripQueryKeys } from "@features/trips/domain";
import { useRegisterTrackingEvent } from "./useRegisterTrackingEvent";

const createEvent = vi.fn();
const invalidateTripAssignmentResources = vi.fn().mockResolvedValue(undefined);
const refetchTripTrackingViews = vi.fn().mockResolvedValue(undefined);

vi.mock("@features/trips/infrastructure", () => ({
  trackingRepository: {
    createEvent: (...args: unknown[]) => createEvent(...args),
  },
}));

vi.mock("../trip/invalidateTripAssignmentResources", () => ({
  invalidateTripAssignmentResources: (...args: unknown[]) =>
    invalidateTripAssignmentResources(...args),
}));

vi.mock("./syncTripDetailFromTimeline", () => ({
  buildTripDetailPatchFromTrackingEvent: () => undefined,
  refetchTripTrackingViews: (...args: unknown[]) =>
    refetchTripTrackingViews(...args),
}));

describe("useRegisterTrackingEvent cache callbacks", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    createEvent.mockResolvedValue({
      data: {
        id: "evt-1",
        tripId: "trip-1",
        eventType: "note",
      },
    });
  });

  it("invalida listas aunque el caller pase onSuccess (no pisa cache sync)", async () => {
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
      () => useRegisterTrackingEvent({ onSuccess: userOnSuccess }),
      { wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync({
        tripId: "trip-1",
        event: {
          eventType: "note",
          occurredAt: "2026-05-17T10:00:00.000Z",
          notes: "hola",
        } as never,
      });
    });

    await waitFor(() => {
      expect(userOnSuccess).toHaveBeenCalled();
    });

    expect(refetchTripTrackingViews).toHaveBeenCalled();
    expect(invalidateTripAssignmentResources).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: tripQueryKeys.lists(),
    });
  });

  it("propaga warnings FISCAL_ATTENTION_PENDING al onSuccess (ADR-0093 H3)", async () => {
    createEvent.mockResolvedValue({
      data: {
        id: "evt-2",
        tripId: "trip-1",
        eventType: "trip_arrived",
      },
      warnings: [
        {
          code: "FISCAL_ATTENTION_PENDING",
          message: "El viaje tiene atención fiscal pendiente",
        },
      ],
    });

    const userOnSuccess = vi.fn();

    function wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(
      () => useRegisterTrackingEvent({ onSuccess: userOnSuccess }),
      { wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync({
        tripId: "trip-1",
        event: {
          eventType: "trip_arrived",
          occurredAt: "2026-05-17T18:00:00.000Z",
          mileage: 100,
        } as never,
      });
    });

    await waitFor(() => {
      expect(userOnSuccess).toHaveBeenCalled();
    });

    expect(userOnSuccess.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        event: expect.objectContaining({ id: "evt-2" }),
        warnings: [
          expect.objectContaining({ code: "FISCAL_ATTENTION_PENDING" }),
        ],
      }),
    );
  });
});
