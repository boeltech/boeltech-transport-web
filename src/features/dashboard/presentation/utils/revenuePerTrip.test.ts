import { describe, expect, it } from "vitest";
import { formatRevenuePerTrip } from "./revenuePerTrip";

describe("formatRevenuePerTrip", () => {
  it("divides actual revenue by trip count", () => {
    expect(formatRevenuePerTrip(90_000, 2)).toBe("$45,000");
  });

  it("returns em dash when trip_count is 0 or missing", () => {
    expect(formatRevenuePerTrip(90_000, 0)).toBe("—");
    expect(formatRevenuePerTrip(90_000, null)).toBe("—");
    expect(formatRevenuePerTrip(90_000, undefined)).toBe("—");
  });

  it("returns em dash when revenue is missing", () => {
    expect(formatRevenuePerTrip(null, 3)).toBe("—");
    expect(formatRevenuePerTrip(undefined, 3)).toBe("—");
  });
});
