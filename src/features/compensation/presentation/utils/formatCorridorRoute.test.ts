import { describe, expect, it } from "vitest";
import {
  buildBranchNameMap,
  formatCorridorEndpoint,
  formatCorridorRouteHuman,
} from "./formatCorridorRoute";

describe("formatCorridorRoute", () => {
  const branchMap = buildBranchNameMap([
    { id: "br-1", code: "MTY", name: "Monterrey" },
  ]);

  it("formats city endpoints without technical prefixes", () => {
    expect(
      formatCorridorRouteHuman({
        originRefType: "city_label",
        originRefValue: "Ciudad de México",
        destinationRefType: "city_label",
        destinationRefValue: "Monterrey",
      }),
    ).toBe("Ciudad de México → Monterrey");
  });

  it("resolves branch UUID to branch label", () => {
    expect(
      formatCorridorEndpoint("branch", "br-1", branchMap),
    ).toBe("MTY — Monterrey");
    expect(
      formatCorridorRouteHuman({
        originRefType: "branch",
        originRefValue: "br-1",
        destinationRefType: "city_label",
        destinationRefValue: "Guadalajara",
      }, branchMap),
    ).toBe("MTY — Monterrey → Guadalajara");
  });
});
