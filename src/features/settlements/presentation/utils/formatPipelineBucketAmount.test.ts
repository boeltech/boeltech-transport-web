import { describe, expect, it } from "vitest";
import {
  formatPipelineBucketAmount,
  PIPELINE_AMOUNT_EMPTY,
} from "./formatPipelineBucketAmount";

describe("formatPipelineBucketAmount", () => {
  it("formatea monto cuando hay suma", () => {
    expect(formatPipelineBucketAmount(48851, 1, "Ver tabla")).toMatch(/48/);
  });

  it("PM-02/V-M5: count>0 sin suma → fallback honesto, no em dash", () => {
    expect(formatPipelineBucketAmount(null, 2, "Ver tabla")).toBe("Ver tabla");
    expect(formatPipelineBucketAmount(undefined, 1, "Ver tabla")).toBe(
      "Ver tabla",
    );
  });

  it("V-M5: count=0 vacío = em dash", () => {
    expect(formatPipelineBucketAmount(null, 0, "Ver tabla")).toBe(
      PIPELINE_AMOUNT_EMPTY,
    );
    expect(PIPELINE_AMOUNT_EMPTY).toBe("\u2014");
  });

  it("muestra $0.00 cuando la API sí envía cero", () => {
    expect(formatPipelineBucketAmount(0, 3, "Ver tabla")).toMatch(/0\.00/);
  });
});
