import { describe, expect, it } from "vitest";
import {
  formatBulkPeriodLabel,
  getMexicoCityPeriodMonth,
  getPreviousMexicoCityPeriodMonth,
  inclusiveMonthSpan,
  isValidPeriodMonth,
  shiftPeriodMonth,
} from "./invoiceBulkDownloadPeriod";

describe("invoiceBulkDownloadPeriod", () => {
  it("valida YYYY-MM", () => {
    expect(isValidPeriodMonth("2026-09")).toBe(true);
    expect(isValidPeriodMonth("2026-13")).toBe(false);
    expect(isValidPeriodMonth("26-09")).toBe(false);
  });

  it("calcula span inclusivo", () => {
    expect(inclusiveMonthSpan("2026-01", "2026-01")).toBe(1);
    expect(inclusiveMonthSpan("2026-01", "2026-12")).toBe(12);
    expect(inclusiveMonthSpan("2025-11", "2026-02")).toBe(4);
  });

  it("shift y mes anterior CDMX", () => {
    expect(shiftPeriodMonth("2026-01", -1)).toBe("2025-12");
    const fixed = new Date("2026-10-11T18:00:00.000Z");
    expect(getMexicoCityPeriodMonth(fixed)).toBe("2026-10");
    expect(getPreviousMexicoCityPeriodMonth(fixed)).toBe("2026-09");
  });

  it("formatea etiqueta de periodo", () => {
    expect(formatBulkPeriodLabel("2026-09", "2026-09")).toBe("2026-09");
    expect(formatBulkPeriodLabel("2026-01", "2026-03")).toBe(
      "2026-01 a 2026-03",
    );
  });
});
