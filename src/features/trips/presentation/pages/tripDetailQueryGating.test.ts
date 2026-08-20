import { describe, expect, it } from "vitest";
import { TripStatus } from "@features/trips/domain";
import {
  parseTripDetailTab,
  resolveDefaultTripDetailTab,
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
    expect(resolveTripDetailTab("history")).toBe("overview");
    expect(parseTripDetailTab("history")).toBeNull();
    expect(parseTripDetailTab("tracking")).toBe("tracking");
  });

  it("picks default tab from status and completeness (D2)", () => {
    expect(
      resolveDefaultTripDetailTab({
        status: TripStatus.DRAFT,
        routeReady: false,
        cargoCount: 0,
        hasPendingCobro: false,
        canShowCosts: true,
      }),
    ).toBe("route");
    expect(
      resolveDefaultTripDetailTab({
        status: TripStatus.DRAFT,
        routeReady: true,
        cargoCount: 0,
        hasPendingCobro: false,
        canShowCosts: true,
      }),
    ).toBe("cargo");
    expect(
      resolveDefaultTripDetailTab({
        status: TripStatus.DRAFT,
        routeReady: true,
        cargoCount: undefined,
        hasPendingCobro: false,
        canShowCosts: true,
      }),
    ).toBe("overview");
    expect(
      resolveDefaultTripDetailTab({
        status: TripStatus.SCHEDULED,
        routeReady: true,
        cargoCount: 1,
        hasPendingCobro: false,
        canShowCosts: true,
      }),
    ).toBe("tracking");
    expect(
      resolveDefaultTripDetailTab({
        status: TripStatus.IN_PROGRESS,
        routeReady: true,
        cargoCount: 1,
        hasPendingCobro: false,
        canShowCosts: true,
      }),
    ).toBe("tracking");
    expect(
      resolveDefaultTripDetailTab({
        status: TripStatus.COMPLETED,
        routeReady: true,
        cargoCount: 1,
        hasPendingCobro: true,
        canShowCosts: true,
      }),
    ).toBe("costs");
    expect(
      resolveDefaultTripDetailTab({
        status: TripStatus.COMPLETED,
        routeReady: true,
        cargoCount: 1,
        hasPendingCobro: true,
        canShowCosts: false,
      }),
    ).toBe("overview");
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
