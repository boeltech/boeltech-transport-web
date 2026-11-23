import { describe, expect, it } from "vitest";
import { resolveTripHelpScreenExtras } from "./resolveTripHelpScreenExtras";

describe("resolveTripHelpScreenExtras — corte B §H.3", () => {
  it("CB-INJ-1: loading sin trip → sin status", () => {
    expect(
      resolveTripHelpScreenExtras({
        tripStatus: undefined,
        activeTab: "overview",
        tripLoaded: false,
      }),
    ).toBeNull();
  });

  it.each([
    ["CB-INJ-2", "draft"],
    ["CB-INJ-3", "scheduled"],
    ["CB-INJ-4", "in_progress"],
  ] as const)("%s: status=%s en overview", (_id, status) => {
    expect(
      resolveTripHelpScreenExtras({
        tripStatus: status,
        activeTab: "overview",
        tripLoaded: true,
      }),
    ).toEqual({ status });
  });

  it("CB-INJ-5a: completed en tracking → status", () => {
    expect(
      resolveTripHelpScreenExtras({
        tripStatus: "completed",
        activeTab: "tracking",
        tripLoaded: true,
      }),
    ).toEqual({ status: "completed" });
  });

  it("CB-INJ-5b: cancelled en route → status", () => {
    expect(
      resolveTripHelpScreenExtras({
        tripStatus: "cancelled",
        activeTab: "route",
        tripLoaded: true,
      }),
    ).toEqual({ status: "cancelled" });
  });

  it("CB-INJ-6: tab=costs → extras null", () => {
    expect(
      resolveTripHelpScreenExtras({
        tripStatus: "draft",
        activeTab: "costs",
        tripLoaded: true,
      }),
    ).toBeNull();
  });

  it("CB-INJ-6b: tab=billing → extras null", () => {
    expect(
      resolveTripHelpScreenExtras({
        tripStatus: "draft",
        activeTab: "billing",
        tripLoaded: true,
      }),
    ).toBeNull();
  });

  it("injects on route/cargo/overview/tracking (default tab)", () => {
    for (const activeTab of ["route", "cargo", "overview", "tracking"] as const) {
      expect(
        resolveTripHelpScreenExtras({
          tripStatus: "scheduled",
          activeTab,
          tripLoaded: true,
        }),
      ).toEqual({ status: "scheduled" });
    }
  });
});
