import { describe, expect, it } from "vitest";
import {
  mapAdvance,
  mapAdvancePeriodDeductionPlan,
  mapNavBadgesResponse,
  mapWorkbenchResponse,
} from "./mappers";

describe("F4 workbench / nav-badges / P10 mappers", () => {
  it("maps summary KPIs and aging", () => {
    const data = mapWorkbenchResponse({
      summary: {
        pending: 1,
        draft: 1,
        approval: 2,
        payable: 3,
        closed: 4,
        open_advances: 5,
        approval_aging_days_max: 2,
        advances_deductible_estimate: 18_500,
        kpis: {
          to_arm: { count: 1, amount: 2500 },
          in_approval: { count: 2, amount: 142_300 },
          authorized_unpaid: { count: 3, amount: 96_400 },
          advances_to_deduct: { count: 5, amount: 18_500 },
        },
      },
      backlog: [],
    });

    expect(data.summary.approvalAgingDaysMax).toBe(2);
    expect(data.summary.advancesDeductibleEstimate).toBe(18_500);
    expect(data.summary.kpis).toEqual({
      toArm: { count: 1, amount: 2500 },
      inApproval: { count: 2, amount: 142_300 },
      authorizedUnpaid: { count: 3, amount: 96_400 },
      advancesToDeduct: { count: 5, amount: 18_500 },
    });
  });

  it("maps nav badges", () => {
    expect(mapNavBadgesResponse({ payments: 38, advances: 4 })).toEqual({
      payments: 38,
      advances: 4,
    });
  });

  it("maps period deduction plan and advance cap", () => {
    expect(
      mapAdvancePeriodDeductionPlan({
        advance_id: "a1",
        amount_per_period: 1000,
        available_balance: 4500,
        projected_periods_estimate: 5,
      }),
    ).toEqual({
      advanceId: "a1",
      amountPerPeriod: 1000,
      availableBalance: 4500,
      projectedPeriodsEstimate: 5,
    });

    const advance = mapAdvance({
      id: "a1",
      tenant_id: "t1",
      folio: "ANT-1",
      employee_id: "e1",
      trip_id: null,
      amount: 4500,
      balance_remaining: 4500,
      currency: "MXN",
      category: "cash_advance",
      status: "disbursed",
      disbursed_at: "2026-11-01T00:00:00.000Z",
      payment_method: "cash",
      bank_reference: null,
      notes: null,
      period_deduction_cap: 1000,
      created_at: "2026-11-01T00:00:00.000Z",
      updated_at: "2026-11-01T00:00:00.000Z",
    });
    expect(advance.periodDeductionCap).toBe(1000);
  });
});
