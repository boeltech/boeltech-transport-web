import { describe, expect, it } from "vitest";
import type { FinanceSummary } from "@features/finance/domain";
import {
  buildInvoicesStatusBreakdown,
  isInvoicesBreakdownEmpty,
} from "./invoicesMonthHelpers";

function summary(
  overrides: Partial<FinanceSummary["invoicesByStatus"]> = {},
): FinanceSummary {
  return {
    totalReceivable: 0,
    collectedThisMonth: 0,
    totalOverdue: 0,
    expensesThisMonth: 0,
    invoicesByStatus: {
      draft: 0,
      stamped: 0,
      cancellationPending: 0,
      cancelled: 0,
      ...overrides,
    },
  };
}

describe("buildInvoicesStatusBreakdown", () => {
  it("maps draft to pending and sums total", () => {
    expect(buildInvoicesStatusBreakdown(summary({ draft: 3, stamped: 5 }))).toEqual({
      stamped: 5,
      pending: 3,
      cancellationPending: 0,
      cancelled: 0,
      total: 8,
    });
  });

  it("returns null without summary", () => {
    expect(buildInvoicesStatusBreakdown(undefined)).toBeNull();
  });
});

describe("isInvoicesBreakdownEmpty", () => {
  it("is empty when total is 0 or null", () => {
    expect(isInvoicesBreakdownEmpty(null)).toBe(true);
    expect(isInvoicesBreakdownEmpty(buildInvoicesStatusBreakdown(summary()))).toBe(
      true,
    );
    expect(
      isInvoicesBreakdownEmpty(
        buildInvoicesStatusBreakdown(summary({ stamped: 1 })),
      ),
    ).toBe(false);
  });
});
