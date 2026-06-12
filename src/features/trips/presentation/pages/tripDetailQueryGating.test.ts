import { describe, expect, it } from "vitest";
import { TripStatus } from "@features/trips/domain";
import {
  resolveTripDetailTab,
  shouldFetchTripCargos,
  shouldFetchTripExpenses,
  shouldFetchTripExpensesSummary,
  shouldFetchTripTimeline,
  shouldFetchTripTimelineForShell,
} from "./tripDetailQueryGating";

describe("tripDetailQueryGating", () => {
  it("resolves tab from search param", () => {
    expect(resolveTripDetailTab("cargo")).toBe("cargo");
    expect(resolveTripDetailTab(null)).toBe("overview");
    expect(resolveTripDetailTab("invalid")).toBe("overview");
  });

  it("gates cargo query to cargo tab", () => {
    expect(shouldFetchTripCargos("cargo", "trip-1")).toBe(true);
    expect(shouldFetchTripCargos("overview", "trip-1")).toBe(false);
    expect(shouldFetchTripCargos("cargo", "")).toBe(false);
  });

  it("gates expenses queries to costs tab", () => {
    expect(shouldFetchTripExpenses("costs", "trip-1")).toBe(true);
    expect(shouldFetchTripExpensesSummary("costs", "trip-1")).toBe(true);
    expect(shouldFetchTripExpenses("overview", "trip-1")).toBe(false);
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

  it("gates shell timeline when not on tracking tab and trip is active", () => {
    expect(
      shouldFetchTripTimelineForShell(
        "overview",
        "trip-1",
        TripStatus.IN_PROGRESS,
      ),
    ).toBe(true);
    expect(
      shouldFetchTripTimelineForShell(
        "tracking",
        "trip-1",
        TripStatus.IN_PROGRESS,
      ),
    ).toBe(false);
    expect(
      shouldFetchTripTimelineForShell(
        "overview",
        "trip-1",
        TripStatus.SCHEDULED,
      ),
    ).toBe(false);
  });
});
