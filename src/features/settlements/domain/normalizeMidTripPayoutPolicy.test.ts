import { describe, expect, it } from "vitest";

import {
  DEFAULT_MID_TRIP_PAYOUT_POLICY,
  normalizeMidTripPayoutPolicy,
} from "./enums";

describe("normalizeMidTripPayoutPolicy", () => {
  it("keeps valid policies", () => {
    expect(normalizeMidTripPayoutPolicy("pay_full_to_each")).toBe(
      "pay_full_to_each",
    );
    expect(normalizeMidTripPayoutPolicy("equal_parts")).toBe("equal_parts");
    expect(normalizeMidTripPayoutPolicy("pay_only_closer")).toBe(
      "pay_only_closer",
    );
  });

  it("defaults to pay_full_to_each", () => {
    expect(DEFAULT_MID_TRIP_PAYOUT_POLICY).toBe("pay_full_to_each");
  });

  it("maps empty, nullish and invalid to default", () => {
    expect(normalizeMidTripPayoutPolicy("")).toBe(DEFAULT_MID_TRIP_PAYOUT_POLICY);
    expect(normalizeMidTripPayoutPolicy("   ")).toBe(
      DEFAULT_MID_TRIP_PAYOUT_POLICY,
    );
    expect(normalizeMidTripPayoutPolicy(null)).toBe(
      DEFAULT_MID_TRIP_PAYOUT_POLICY,
    );
    expect(normalizeMidTripPayoutPolicy(undefined)).toBe(
      DEFAULT_MID_TRIP_PAYOUT_POLICY,
    );
    expect(normalizeMidTripPayoutPolicy("not_a_policy")).toBe(
      DEFAULT_MID_TRIP_PAYOUT_POLICY,
    );
  });
});
