import { describe, expect, it } from "vitest";
import {
  DEFAULT_OPERATIONAL_PLAN_CODE,
  recommendOperationalPlanCode,
} from "./recommendOperationalPlan";

describe("recommendOperationalPlanCode", () => {
  it("defaults to Micro when band is omitted", () => {
    expect(recommendOperationalPlanCode({})).toBe(DEFAULT_OPERATIONAL_PLAN_CODE);
    expect(recommendOperationalPlanCode({ band: null })).toBe(
      DEFAULT_OPERATIONAL_PLAN_CODE,
    );
    expect(DEFAULT_OPERATIONAL_PLAN_CODE).toBe("operacion_micro");
  });

  it.each([
    ["1_10", "operacion_micro"],
    ["11_30", "operacion_pequena"],
    ["31_100", "operacion_mediana"],
    ["100_plus", "operacion_grande"],
  ] as const)("band %s → %s", (band, planCode) => {
    expect(recommendOperationalPlanCode({ band })).toBe(planCode);
  });
});
