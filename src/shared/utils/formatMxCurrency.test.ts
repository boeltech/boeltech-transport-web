import { describe, expect, it } from "vitest";

import {
  formatMxCurrency,
  formatMxCurrencyCompact,
  formatMxCurrencyNullable,
  formatMxCurrencyOrDash,
  formatMxCurrencyWhole,
} from "./formatMxCurrency";

describe("formatMxCurrency", () => {
  it("formats amounts with MXN currency", () => {
    expect(formatMxCurrency(25000)).toMatch(/25,?000\.00/);
    expect(formatMxCurrency(25000)).toContain("$");
  });

  it("formats whole amounts without decimals", () => {
    expect(formatMxCurrencyWhole(500000)).toMatch(/500,?000/);
    expect(formatMxCurrencyWhole(500000)).not.toContain(".00");
  });

  it("returns null for nullable helper", () => {
    expect(formatMxCurrencyNullable(null)).toBeNull();
    expect(formatMxCurrencyNullable(undefined)).toBeNull();
    expect(formatMxCurrencyNullable(100)).toContain("$");
  });

  it("returns dash for empty display helper", () => {
    expect(formatMxCurrencyOrDash(null)).toBe("—");
    expect(formatMxCurrencyOrDash(0)).toContain("$");
  });

  it("formats compact axis ticks", () => {
    expect(formatMxCurrencyCompact(1_250_000)).toBe("$1.3 M");
    expect(formatMxCurrencyCompact(600_000)).toBe("$600 k");
    expect(formatMxCurrencyCompact(500)).toBe("$500");
    expect(formatMxCurrencyCompact(0)).toBe("$0");
    expect(formatMxCurrencyCompact(-2_000)).toBe("−$2 k");
  });
});
