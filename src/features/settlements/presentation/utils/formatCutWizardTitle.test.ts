import { describe, expect, it } from "vitest";
import {
  formatCutPeriodRange,
  formatCutWizardTitle,
} from "./formatCutWizardTitle";

describe("formatCutWizardTitle (C32)", () => {
  it("formatea rango es-MX corto", () => {
    expect(formatCutPeriodRange("2026-09-07", "2026-09-13")).toBe(
      "7 al 13 sep 2026",
    );
  });

  it("arma título con ritmo y periodo", () => {
    expect(
      formatCutWizardTitle({
        salaryPeriod: "weekly",
        periodStart: "2026-09-07",
        periodEnd: "2026-09-13",
        includePeriodRange: true,
      }),
    ).toBe("Corte semanal · 7 al 13 sep 2026");
  });
});
