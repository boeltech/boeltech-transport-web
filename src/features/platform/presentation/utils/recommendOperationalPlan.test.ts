import { describe, expect, it } from "vitest";
import {
  DEFAULT_OPERATIONAL_PLAN_CODE,
  recommendOperationalPlanCode,
} from "./recommendOperationalPlan";

describe("recommendOperationalPlanCode", () => {
  it("defaults to Esencial when band is omitted", () => {
    expect(recommendOperationalPlanCode({})).toBe(DEFAULT_OPERATIONAL_PLAN_CODE);
    expect(recommendOperationalPlanCode({ band: null })).toBe(
      DEFAULT_OPERATIONAL_PLAN_CODE,
    );
  });

  it.each([
    ["1_10", "operacion_esencial"],
    ["11_30", "operacion_crecimiento"],
    ["31_100", "operacion_escala"],
    ["100_plus", "operacion_corporativo"],
  ] as const)("band %s → %s", (band, planCode) => {
    expect(recommendOperationalPlanCode({ band })).toBe(planCode);
  });
});
