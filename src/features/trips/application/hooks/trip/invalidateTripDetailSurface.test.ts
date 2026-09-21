import { describe, expect, it, beforeEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";

import { TripStatus, tripQueryKeys } from "@features/trips/domain";

import { invalidateTripDetailSurface } from "./invalidateTripDetailSurface";

describe("invalidateTripDetailSurface", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("purges timeline when status is cancelled", async () => {
    const tripId = "trip-1";
    queryClient.setQueryData(tripQueryKeys.detail(tripId), {
      id: tripId,
      status: TripStatus.IN_PROGRESS,
    });
    queryClient.setQueryData(tripQueryKeys.timeline(tripId), {
      trip: { status: TripStatus.IN_PROGRESS },
    });

    await invalidateTripDetailSurface(queryClient, tripId, {
      status: TripStatus.CANCELLED,
    });

    expect(queryClient.getQueryState(tripQueryKeys.detail(tripId))?.isInvalidated).toBe(
      true,
    );
    expect(queryClient.getQueryData(tripQueryKeys.timeline(tripId))).toBeUndefined();
  });

  it("purges timeline when status is scheduled (post-confirm)", async () => {
    const tripId = "trip-2";
    queryClient.setQueryData(tripQueryKeys.timeline(tripId), {
      trip: { status: TripStatus.DRAFT },
    });

    await invalidateTripDetailSurface(queryClient, tripId, {
      status: TripStatus.SCHEDULED,
    });

    expect(queryClient.getQueryData(tripQueryKeys.timeline(tripId))).toBeUndefined();
  });

  it("invalidates timeline (keeps cache) when status is in_progress", async () => {
    const tripId = "trip-3";
    const timeline = { trip: { status: TripStatus.IN_PROGRESS } };
    queryClient.setQueryData(tripQueryKeys.timeline(tripId), timeline);

    await invalidateTripDetailSurface(queryClient, tripId, {
      status: TripStatus.IN_PROGRESS,
    });

    expect(queryClient.getQueryData(tripQueryKeys.timeline(tripId))).toEqual(timeline);
    expect(
      queryClient.getQueryState(tripQueryKeys.timeline(tripId))?.isInvalidated,
    ).toBe(true);
  });

  it("purges timeline when status is omitted", async () => {
    const tripId = "trip-4";
    queryClient.setQueryData(tripQueryKeys.timeline(tripId), {
      trip: { status: TripStatus.IN_PROGRESS },
    });

    await invalidateTripDetailSurface(queryClient, tripId);

    expect(queryClient.getQueryData(tripQueryKeys.timeline(tripId))).toBeUndefined();
  });

  it("invalidates revenue-split alongside trip detail (C7)", async () => {
    const tripId = "trip-5";
    queryClient.setQueryData(tripQueryKeys.detail(tripId), { id: tripId });
    queryClient.setQueryData(tripQueryKeys.revenueSplit(tripId), {
      status: "active",
    });

    await invalidateTripDetailSurface(queryClient, tripId, {
      status: TripStatus.CANCELLED,
    });

    expect(
      queryClient.getQueryState(tripQueryKeys.detail(tripId))?.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryState(tripQueryKeys.revenueSplit(tripId))
        ?.isInvalidated,
    ).toBe(true);
  });
});
