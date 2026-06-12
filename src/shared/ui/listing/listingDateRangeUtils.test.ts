import { describe, expect, it } from "vitest";
import { formatListingDateRangeLabel } from "./listingDateRangeUtils";

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
