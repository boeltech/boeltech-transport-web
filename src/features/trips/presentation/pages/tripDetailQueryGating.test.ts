import { describe, expect, it } from "vitest";
import { TripStatus } from "@features/trips/domain";
import {
  resolveTripDetailTab,
  shouldFetchTripCargos,
  shouldFetchTripExpenses,
  shouldFetchTripExpensesSummary,
  shouldFetchTripTimeline,
  shouldFetchTripTimelineForShell,
  tripStatusNeedsTrackingContext,
} from "./tripDetailQueryGating";

describe("tripDetailQueryGating", () => {
  it("resolves tab from search param", () => {
    expect(resolveTripDetailTab("cargo")).toBe("cargo");
    expect(resolveTripDetailTab(null)).toBe("overview");
    expect(resolveTripDetailTab("invalid")).toBe("overview");
  });

  it("gates cargo query to cargo tab or operational tracking", () => {
    expect(shouldFetchTripCargos("cargo", "trip-1")).toBe(true);
    expect(shouldFetchTripCargos("overview", "trip-1")).toBe(false);
    expect(shouldFetchTripCargos("cargo", "")).toBe(false);
    expect(
      shouldFetchTripCargos("tracking", "trip-1", TripStatus.IN_PROGRESS),
    ).toBe(true);
    expect(
      shouldFetchTripCargos("tracking", "trip-1", TripStatus.COMPLETED),
    ).toBe(true);
    expect(
      shouldFetchTripCargos("tracking", "trip-1", TripStatus.SCHEDULED),
    ).toBe(false);
    expect(shouldFetchTripCargos("tracking", "trip-1")).toBe(false);
  });

  it("gates expenses list to costs tab but summary is always-on with tripId", () => {
    expect(shouldFetchTripExpenses("costs", "trip-1")).toBe(true);
    expect(shouldFetchTripExpenses("overview", "trip-1")).toBe(false);
    expect(shouldFetchTripExpensesSummary("costs", "trip-1")).toBe(true);
    expect(shouldFetchTripExpensesSummary("overview", "trip-1")).toBe(true);
    expect(shouldFetchTripExpensesSummary("cargo", "trip-1")).toBe(true);
    expect(shouldFetchTripExpensesSummary("overview", "")).toBe(false);
  });

  it("disables expenses queries when canFetchExpenses is false (portal client)", () => {
    expect(shouldFetchTripExpenses("costs", "trip-1", false)).toBe(false);
    expect(shouldFetchTripExpensesSummary("overview", "trip-1", false)).toBe(
      false,
    );
  });

  it("fetches timeline on route and tracking tabs", () => {
    expect(shouldFetchTripTimeline("route", "trip-1", TripStatus.SCHEDULED)).toBe(
      true,
    );
    expect(
      shouldFetchTripTimeline("tracking", "trip-1", TripStatus.IN_PROGRESS),
    ).toBe(true);
    expect(shouldFetchTripTimeline("overview", "trip-1", TripStatus.DRAFT)).toBe(
      false,
    );
  });

  it("shell timeline only for in_progress/completed outside tracking", () => {
    expect(
      shouldFetchTripTimelineForShell(
        "overview",
        "trip-1",
        TripStatus.IN_PROGRESS,
      ),
    ).toBe(true);
    expect(
      shouldFetchTripTimelineForShell("tracking", "trip-1", TripStatus.IN_PROGRESS),
    ).toBe(false);
    expect(
      shouldFetchTripTimelineForShell("overview", "trip-1", TripStatus.DRAFT),
    ).toBe(false);
  });

  it("tripStatusNeedsTrackingContext matches operational statuses", () => {
    expect(tripStatusNeedsTrackingContext(TripStatus.IN_PROGRESS)).toBe(true);
    expect(tripStatusNeedsTrackingContext(TripStatus.COMPLETED)).toBe(true);
    expect(tripStatusNeedsTrackingContext(TripStatus.DRAFT)).toBe(false);
  });
});
