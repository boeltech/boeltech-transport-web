import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { tripQueryKeys, type Trip, type TripStop } from "@features/trips/domain";
import {
  buildStopsByIdFromCache,
  findMissingTripCorrectionStopIds,
  prefetchInvoiceLinkedTrips,
} from "./substitutionTripPrefetch";

vi.mock("@features/trips/application", () => ({
  createGetTripByIdUseCase: () => ({
    execute: vi.fn(async (id: string) => ({
      success: true,
      data: {
        id,
        stops: [{ id: `stop-${id}`, sequenceOrder: 0 }],
      },
    })),
  }),
}));

vi.mock("@features/trips/infrastructure", () => ({
  tripRepository: {},
}));

function buildStop(id: string): TripStop {
  return {
    id,
    tripId: "trip-1",
    sequenceOrder: 0,
    stopType: "origin",
    status: "pending",
  } as unknown as TripStop;
}

describe("substitutionTripPrefetch", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("prefetchInvoiceLinkedTrips populates trip detail cache", async () => {
    await prefetchInvoiceLinkedTrips(queryClient, ["trip-a", "trip-b"]);

    expect(queryClient.getQueryData(tripQueryKeys.detail("trip-a"))).toMatchObject({
      id: "trip-a",
    });
    expect(queryClient.getQueryData(tripQueryKeys.detail("trip-b"))).toMatchObject({
      id: "trip-b",
    });
  });

  it("buildStopsByIdFromCache merges stops from cached trips", () => {
    queryClient.setQueryData<Trip>(tripQueryKeys.detail("trip-a"), {
      id: "trip-a",
      stops: [buildStop("stop-a")],
    } as Trip);

    const map = buildStopsByIdFromCache(queryClient, ["trip-a"]);
    expect(map.get("stop-a")?.id).toBe("stop-a");
  });

  it("findMissingTripCorrectionStopIds returns stop ids not in map", () => {
    const map = new Map([["stop-a", buildStop("stop-a")]]);
    expect(
      findMissingTripCorrectionStopIds(
        [{ stop_id: "stop-a" }, { stop_id: "stop-missing" }],
        map,
      ),
    ).toEqual(["stop-missing"]);
  });
});
