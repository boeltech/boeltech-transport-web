import { describe, expect, it } from "vitest";
import {
  DEFAULT_OPERATIONAL_PLAN_CODE,
  OPERATIONAL_PLAN_BY_BAND,
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

  it("maps declared bands to v5 plan codes", () => {
    expect(OPERATIONAL_PLAN_BY_BAND).toEqual({
      "1_10": "operacion_micro",
      "11_30": "operacion_pequena",
      "31_100": "operacion_mediana",
      "100_plus": "operacion_grande",
    });
  });
});
