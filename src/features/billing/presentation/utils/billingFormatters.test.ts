import { describe, expect, it } from "vitest";
import { formatBillingPriceCents } from "./billingFormatters";

describe("formatBillingPriceCents", () => {
  it("formats whole-peso amounts with two decimals", () => {
    expect(formatBillingPriceCents(74900)).toMatch(/749\.00/);
  });

  it("preserves IVA cents (no round to whole peso)", () => {
    expect(formatBillingPriceCents(22368)).toMatch(/223\.68/);
  });

  it("formats estimated total with cents", () => {
    expect(formatBillingPriceCents(162168)).toMatch(/1[,.]621\.68/);
  });
});
