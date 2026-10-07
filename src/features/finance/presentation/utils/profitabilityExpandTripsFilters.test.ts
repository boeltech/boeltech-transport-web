import { describe, expect, it } from "vitest";
import { buildProfitabilityTripsFiltersForExpand } from "./profitabilityExpandTripsFilters";

describe("buildProfitabilityTripsFiltersForExpand", () => {
  it("applies the period and scope to the trips of an opened group", () => {
    expect(
      buildProfitabilityTripsFiltersForExpand("client", "client-1", {
        scope: "operational",
        from: "2025-10-01",
        to: "2026-09-30",
      }),
    ).toMatchObject({
      clientId: "client-1",
      scope: "operational",
      from: "2025-10-01",
      to: "2026-09-30",
      profitabilityStatus: undefined,
      limit: 100,
    });
  });

  it("only filters loss trips (worst first) when the loss card is active", () => {
    expect(
      buildProfitabilityTripsFiltersForExpand("vehicle", "veh-1", { lossOnly: true }),
    ).toMatchObject({
      vehicleId: "veh-1",
      profitabilityStatus: ["loss"],
      sortOrder: "asc",
    });
  });

  it("splits route keys into origin and destination", () => {
    expect(
      buildProfitabilityTripsFiltersForExpand("route", "Monterrey -> Saltillo"),
    ).toMatchObject({ origin: "Monterrey", destination: "Saltillo" });
    expect(buildProfitabilityTripsFiltersForExpand("route", "sin-separador")).toBeNull();
  });
});
