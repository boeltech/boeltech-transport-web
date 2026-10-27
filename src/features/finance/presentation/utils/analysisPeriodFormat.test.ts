import { describe, expect, it } from "vitest";
import { resolveAnalysisPeriod } from "@features/finance/application";
import { financeCopy } from "../copy";
import {
  formatAnalysisPeriodCaption,
  formatAnalysisPeriodRange,
  formatAnalysisStickyCaption,
  formatDaySpan,
  formatMonthSpan,
} from "./analysisPeriodFormat";

const TODAY = "2026-10-06";

function caption(from: string, to: string): string {
  return formatAnalysisPeriodCaption(resolveAnalysisPeriod({ from, to }, TODAY), TODAY);
}

describe("formatAnalysisPeriodCaption", () => {
  it("defaults to «Este mes»: month in progress with the data cut-off day", () => {
    expect(caption("", "")).toBe("Octubre 2026 · mes en curso · datos al 06 oct");
  });

  it("labels «Últimos 12 meses» as 12 complete months without cut-off", () => {
    expect(caption("2025-10-01", "2026-09-30")).toBe(
      "Oct 2025–sep 2026 · 12 meses completos",
    );
  });

  it("labels a single past month (from «Cifras por mes») as one complete month", () => {
    expect(caption("2026-09-01", "2026-09-30")).toBe("Septiembre 2026 · 1 mes completo");
  });

  it("shows days for a custom range that is not whole months", () => {
    expect(caption("2026-09-10", "2026-09-20")).toBe("10–20 sep 2026 (días)");
  });

  it("adds the cut-off when a custom day range touches the current month", () => {
    expect(caption("2026-09-20", "2026-10-05")).toBe(
      "20 sep–05 oct 2026 (días) · datos al 06 oct",
    );
  });
});

describe("formatAnalysisStickyCaption", () => {
  it("appends the bases legend to the period caption", () => {
    const period = resolveAnalysisPeriod({ from: "", to: "" }, TODAY);
    expect(formatAnalysisStickyCaption(period, TODAY)).toBe(
      `Octubre 2026 · mes en curso · datos al 06 oct · ${financeCopy.pulse.basisLine}`,
    );
  });
});

describe("formatAnalysisPeriodRange", () => {
  it("handles open-ended ranges", () => {
    expect(formatAnalysisPeriodRange("2026-09-10", undefined)).toMatch(/^desde 10 \S+ 2026$/);
    expect(formatAnalysisPeriodRange(undefined, undefined)).toBe("");
  });
});

describe("formatMonthSpan / formatDaySpan", () => {
  it("collapses the year when both ends share it", () => {
    expect(formatMonthSpan("2026-07", "2026-09")).toBe("jul–sep 2026");
    expect(formatMonthSpan("2025-10", "2026-09")).toBe("oct 2025–sep 2026");
    expect(formatDaySpan("2026-10-06", "2026-10-20")).toBe("06–20 oct 2026");
    expect(formatDaySpan("2025-12-20", "2026-01-05")).toBe("20 dic 2025–05 ene 2026");
  });
});
