import { describe, expect, it } from "vitest";
import { sumOpenArAging } from "./opsArAging";

describe("sumOpenArAging", () => {
  it("puts open invoices with days overdue in the overdue bucket only", () => {
    expect(
      sumOpenArAging([
        { status: "open", daysOverdue: 0, totalCents: 100 },
        { status: "open", daysOverdue: 3, totalCents: 40 },
        { status: "paid", daysOverdue: 0, totalCents: 999 },
        { status: "void", daysOverdue: 12, totalCents: 50 },
      ]),
    ).toEqual({ currentCents: 100, overdueCents: 40 });
  });
});
