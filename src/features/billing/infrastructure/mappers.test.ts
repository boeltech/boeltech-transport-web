import { describe, expect, it } from "vitest";
import {
  mapBillingArrears,
  mapBillingEntitlements,
  mapBillingSubscription,
  mapBillingUsage,
} from "./mappers";

describe("billing mappers", () => {
  it("mapBillingSubscription converts snake_case API payload", () => {
    const sub = mapBillingSubscription({
      plan_code: "operacion_esencial",
      plan_name: "Operación Esencial",
      status: "active",
      billing_cycle: "monthly",
      monthly_price_cents: 74900,
      included_stamps: 120,
      stamps_used_this_period: 45,
      quota_policy: "soft_cap",
      current_period_start: "2026-07-01T00:00:00.000Z",
      current_period_end: "2026-07-31T23:59:59.999Z",
      trial_ends_at: null,
      notes: null,
      limits: {
        max_users: 3,
        max_branches: 1,
        history_months: 6,
      },
      profitability_level: "L0",
    });

    expect(sub.planCode).toBe("operacion_esencial");
    expect(sub.profitabilityLevel).toBe("L0");
    expect(sub.limits.maxUsers).toBe(3);
  });

  it("mapBillingUsage maps stamp counters and history", () => {
    const usage = mapBillingUsage({
      tenant_id: "t1",
      plan_code: "operacion_esencial",
      period_key: "2026-07",
      current_period_start: "2026-07-01T00:00:00.000Z",
      current_period_end: "2026-07-31T23:59:59.999Z",
      included_stamps: 120,
      stamps_used: 80,
      overage_stamps: 5,
      overage_price_cents: 600,
      overage_total_cents: 3000,
      quota_policy: "soft_cap",
      history: [{ period_key: "2026-06", stamps_used: 90, overage_stamps: 0 }],
    });

    expect(usage.stampsUsed).toBe(80);
    expect(usage.history[0]?.periodKey).toBe("2026-06");
  });

  it("mapBillingEntitlements maps catalog, commercial summary and line items", () => {
    const entitlements = mapBillingEntitlements({
      direct_entitlements: [
        {
          module_code: "internal_staff_compensation",
          module_name: "Equipo de apoyo en viajes",
          kind: "addon",
          status: "active",
          activated_at: "2026-07-01T12:00:00.000Z",
          price_locked_cents: 5900,
          price_tier: "ea",
          member_codes: [],
        },
      ],
      effective_module_codes: ["internal_staff_compensation"],
      profitability_level: "L0.5",
      catalog: [
        {
          code: "internal_staff_compensation",
          name: "Equipo de apoyo en viajes",
          kind: "addon",
          is_active_for_tenant: true,
          member_codes: [],
          price_ea_cents: 5900,
          price_ga_cents: 10900,
          maturity: "beta",
        },
      ],
      commercial_summary: {
        plan_monthly_price_cents: 74900,
        modules_total_cents: 5900,
        overage_total_cents: 0,
        subtotal_cents: 80800,
        iva_cents: 12928,
        estimated_total_cents: 93728,
        currency: "MXN",
        period_key: "2026-07",
        billing_cycle: "monthly",
      },
    });

    expect(entitlements.directEntitlements[0]?.moduleCode).toBe(
      "internal_staff_compensation",
    );
    expect(entitlements.directEntitlements[0]?.priceLockedCents).toBe(5900);
    expect(entitlements.commercialSummary.estimatedTotalCents).toBe(93728);
    expect(entitlements.catalog[0]?.maturity).toBe("beta");
  });

  it("mapBillingArrears maps open July charge (S2) snake_case payload", () => {
    const arrears = mapBillingArrears({
      currency: "MXN",
      open_count: 1,
      total_open_cents: 215424,
      oldest_due_date: "2026-08-15T05:59:59.999Z",
      max_days_overdue: 0,
      invoices: [
        {
          id: "inv-july",
          period_key: "2026-07",
          status: "open",
          total_cents: 215424,
          amount_due_cents: 215424,
          due_date: "2026-08-15T05:59:59.999Z",
          days_overdue: 0,
          issued_at: "2026-08-01T16:00:00.000Z",
        },
      ],
    });

    expect(arrears.openCount).toBe(1);
    expect(arrears.totalOpenCents).toBe(215424);
    expect(arrears.oldestDueDate).toBe("2026-08-15T05:59:59.999Z");
    expect(arrears.maxDaysOverdue).toBe(0);
    expect(arrears.invoices[0]?.periodKey).toBe("2026-07");
    expect(arrears.invoices[0]?.amountDueCents).toBe(215424);
    expect(arrears.invoices[0]?.daysOverdue).toBe(0);
    expect(arrears.invoices[0]?.dueDate).toBe("2026-08-15T05:59:59.999Z");
  });
});
