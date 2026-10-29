import { describe, expect, it } from "vitest";
import {
  DECLARED_FLEET_BANDS,
  DEFAULT_OPERATIONAL_PLAN_CODE,
  LEGACY_DECLARED_FLEET_BANDS,
  OPERATIONAL_PLAN_BY_BAND,
  isDeclaredFleetBand,
  recommendOperationalPlanCode,
} from "./recommendOperationalPlan";

describe("recommendOperationalPlanCode (SoT v5)", () => {
  it("defaults to operacion_micro without band", () => {
    expect(DEFAULT_OPERATIONAL_PLAN_CODE).toBe("operacion_micro");
    expect(recommendOperationalPlanCode({})).toBe("operacion_micro");
    expect(recommendOperationalPlanCode({ band: null })).toBe(
      "operacion_micro",
    );
  });

  it("offers only v5 bands for a new declaration", () => {
    expect(DECLARED_FLEET_BANDS).toEqual([
      "1_5",
      "6_30",
      "31_100",
      "100_plus",
    ]);
    expect(LEGACY_DECLARED_FLEET_BANDS).toEqual(["1_10", "11_30"]);
  });

  it("maps declared bands to v5 plan codes", () => {
    expect(OPERATIONAL_PLAN_BY_BAND).toEqual({
      "1_5": "operacion_micro",
      "6_30": "operacion_pequena",
      "31_100": "operacion_mediana",
      "100_plus": "operacion_grande",
      "1_10": "operacion_micro",
      "11_30": "operacion_pequena",
    });
  });

  it("accepts a stored legacy band and rejects an unknown code", () => {
    expect(isDeclaredFleetBand("1_5")).toBe(true);
    expect(isDeclaredFleetBand("1_10")).toBe(true);
    expect(isDeclaredFleetBand("11_30")).toBe(true);
    expect(isDeclaredFleetBand("nope")).toBe(false);
  });
});
