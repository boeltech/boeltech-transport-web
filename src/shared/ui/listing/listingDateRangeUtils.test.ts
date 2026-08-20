import { describe, expect, it } from "vitest";
import { getTodayString } from "@shared/utils/dateUtils";
import {
  formatListingDateRangeLabel,
  LISTING_DATE_RANGE_QUICK_PRESETS,
} from "./listingDateRangeUtils";

describe("formatListingDateRangeLabel", () => {
  it("returns placeholder when no dates are set", () => {
    expect(formatListingDateRangeLabel("", "")).toBe("Filtrar por fecha");
  });

  it("formats from-only and to-only labels", () => {
    expect(formatListingDateRangeLabel("2026-06-01", "")).toContain("Desde");
    expect(formatListingDateRangeLabel("", "2026-06-06")).toContain("Hasta");
  });

  it("formats a full range", () => {
    const label = formatListingDateRangeLabel("2026-06-01", "2026-06-06");
    expect(label).toContain("-");
  });
});

describe("LISTING_DATE_RANGE_QUICK_PRESETS", () => {
  it("uses Mexico civil today for the Hoy preset", () => {
    const preset = LISTING_DATE_RANGE_QUICK_PRESETS.today();
    expect(preset.fromDate).toBe(getTodayString());
    expect(preset.toDate).toBe(getTodayString());
  });
});
