import { describe, expect, it } from "vitest";
import { resolveAnalysisPeriod } from "@features/finance/application";
import {
  formatAnalysisPeriodCaption,
  formatAnalysisPeriodRange,
} from "./analysisPeriodFormat";

const TODAY = "2026-10-06";

function caption(from: string, to: string): string {
  return formatAnalysisPeriodCaption(resolveAnalysisPeriod({ from, to }, TODAY), TODAY);
}

describe("formatAnalysisPeriodCaption", () => {
  it("labels the default period as 12 complete months", () => {
    expect(caption("", "")).toBe(
      "Periodo: oct 2025 a sep 2026 · 12 meses completos",
    );
  });

  it("labels «Este mes» as the month in progress", () => {
    expect(caption("2026-10-01", "2026-10-31")).toBe(
      "Periodo: oct 2026 · mes en curso",
    );
  });

  it("labels a single past month (from «Cifras por mes») as one complete month", () => {
    expect(caption("2026-09-01", "2026-09-30")).toBe(
      "Periodo: sep 2026 · 1 mes completo",
    );
  });

  it("shows days for a custom range that is not whole months", () => {
    expect(caption("2026-09-10", "2026-09-20")).toMatch(
      /^Periodo: 10 \S+ 2026 a 20 \S+ 2026$/,
    );
  });
});

describe("formatAnalysisPeriodRange", () => {
  it("handles open-ended ranges", () => {
    expect(formatAnalysisPeriodRange("2026-09-10", undefined)).toMatch(/^desde 10 \S+ 2026$/);
    expect(formatAnalysisPeriodRange(undefined, undefined)).toBe("");
  });
});
