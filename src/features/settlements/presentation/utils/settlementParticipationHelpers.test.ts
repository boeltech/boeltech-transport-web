import { describe, expect, it } from "vitest";
import { shouldShowSupportParticipationBadge } from "./settlementParticipationHelpers";

describe("shouldShowSupportParticipationBadge", () => {
  it("returns true when applied rule mentions tarifa diaria", () => {
    expect(
      shouldShowSupportParticipationBadge("Tarifa diaria ($500)", "rate_per_km"),
    ).toBe(true);
  });

  it("returns true when agreement is fixed_daily_rate", () => {
    expect(shouldShowSupportParticipationBadge(null, "fixed_daily_rate")).toBe(true);
  });

  it("returns false for titular commission rules", () => {
    expect(
      shouldShowSupportParticipationBadge("Tarifa por km ($3.5/km)", "rate_per_km"),
    ).toBe(false);
  });
});
