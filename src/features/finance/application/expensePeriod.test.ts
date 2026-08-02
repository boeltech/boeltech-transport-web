import { describe, expect, it } from "vitest";
import { getCurrentMonthExpenseRange } from "./expensePeriod";

describe("getCurrentMonthExpenseRange", () => {
  it("returns the local calendar month including leap years", () => {
    expect(getCurrentMonthExpenseRange(new Date(2024, 1, 15, 12))).toEqual({
      from: "2024-02-01",
      to: "2024-02-29",
    });
  });
});

