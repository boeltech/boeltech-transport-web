import { describe, expect, it } from "vitest";
import {
  mapBillingAccess,
  mapBillingArrears,
  mapBillingEntitlements,
  mapBillingPaymentMethod,
  mapBillingSetupIntent,
  mapBillingSubscription,
  mapBillingUsage,
  mapSaasInvoicePayResult,
} from "./mappers";

describe("billing mappers", () => {
  it("mapBillingAccess maps slim access payload without commercial fields", () => {
    const access = mapBillingAccess({
      subscription_status: "active",
      is_operational: true,
      trial_ends_at: null,
      plan_name: "Operación Arranque",
      effective_module_codes: ["gps_tracking"],
    });

    expect(access).toEqual({
      subscriptionStatus: "active",
      isOperational: true,
      trialEndsAt: null,
      planName: "Operación Arranque",
      effectiveModuleCodes: ["gps_tracking"],
    });
  });

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
    expect(sub.pricePerMotrizCents).toBeNull();
    expect(sub.stampsPerMotriz).toBe(30);
    expect(sub.qFact).toBeNull();
    expect(sub.overagePriceCents).toBe(0);
    // Legacy fallback: granted desde limits, usage desconocido
    expect(sub.capacityBandCode).toBe("operacion_esencial");
    expect(sub.pendingCapacityBandCode).toBeNull();
    expect(sub.capacity.users.granted).toBe(3);
    expect(sub.capacity.users.usage).toBeNull();
    expect(sub.capacity.branches.granted).toBe(1);
    expect(sub.capacity.historyMonths.granted).toBe(6);
    expect(sub.capacity.users.status).toBe("within_limit");
  });

  it("mapBillingSubscription maps SoT v5 motriz fields (piloto Pequeña)", () => {
    const sub = mapBillingSubscription({
      plan_code: "operacion_pequena",
      plan_name: "Operación Pequeña",
      status: "active",
      billing_cycle: "monthly",
      monthly_price_cents: 0,
      included_stamps: 420,
      stamps_used_this_period: 12,
      quota_policy: "soft_cap",
      current_period_start: "2026-09-01T06:00:00.000Z",
      current_period_end: "2026-10-01T05:59:59.999Z",
      trial_ends_at: null,
      notes: null,
      limits: {
        max_users: 10,
        max_branches: 3,
        history_months: 12,
      },
      profitability_level: "L0",
      price_per_motriz_cents: 31900,
      stamps_per_motriz: 30,
      band_q_min: 6,
      band_q_max: 30,
      overage_price_cents: 500,
      q_fact: 14,
    });

    expect(sub.pricePerMotrizCents).toBe(31900);
    expect(sub.stampsPerMotriz).toBe(30);
    expect(sub.bandQMin).toBe(6);
    expect(sub.bandQMax).toBe(30);
    expect(sub.overagePriceCents).toBe(500);
    expect(sub.qFact).toBe(14);
    expect(sub.includedStamps).toBe(420);
  });

  it("mapBillingSubscription maps ADR-0095 capacity snapshot", () => {
    const sub = mapBillingSubscription({
      plan_code: "operacion_pequena",
      plan_name: "Operación Pequeña",
      status: "active",
      billing_cycle: "monthly",
      monthly_price_cents: 0,
      included_stamps: 420,
      stamps_used_this_period: 12,
      quota_policy: "soft_cap",
      current_period_start: "2026-09-01T06:00:00.000Z",
      current_period_end: "2026-10-01T05:59:59.999Z",
      trial_ends_at: null,
      notes: null,
      capacity_band_code: "operacion_pequena",
      pending_capacity_band_code: "operacion_micro",
      limits: {
        max_users: 15,
        max_branches: 3,
        history_months: 24,
      },
      capacity: {
        band_code: "operacion_pequena",
        pending_band_code: "operacion_micro",
        users: {
          granted: 15,
          usage: 18,
          limit_reached: true,
          over_quota: true,
          over_quota_count: 3,
          status: "over_limit",
        },
        branches: {
          granted: 3,
          usage: 2,
          limit_reached: false,
          over_quota: false,
          over_quota_count: 0,
          status: "within_limit",
        },
        history_months: { granted: 24 },
      },
      profitability_level: "L0",
      price_per_motriz_cents: 31900,
      stamps_per_motriz: 30,
      band_q_min: 6,
      band_q_max: 30,
      overage_price_cents: 500,
      q_fact: 14,
    });

    expect(sub.capacityBandCode).toBe("operacion_pequena");
    expect(sub.pendingCapacityBandCode).toBe("operacion_micro");
    expect(sub.capacity.bandCode).toBe("operacion_pequena");
    expect(sub.capacity.pendingBandCode).toBe("operacion_micro");
    expect(sub.capacity.users).toEqual({
      granted: 15,
      usage: 18,
      limitReached: true,
      overQuota: true,
      overQuotaCount: 3,
      status: "over_limit",
    });
    expect(sub.capacity.branches.usage).toBe(2);
    expect(sub.capacity.historyMonths.granted).toBe(24);
    expect(sub.limits.maxUsers).toBe(15);
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
          module_code: "gps_tracking",
          module_name: "Rastreo GPS en tiempo real",
          kind: "addon",
          status: "active",
          activated_at: "2026-07-01T12:00:00.000Z",
          price_locked_cents: 14900,
          price_tier: "ea",
          member_codes: [],
        },
      ],
      effective_module_codes: ["gps_tracking"],
      profitability_level: "L1",
      catalog: [
        {
          code: "gps_tracking",
          name: "Rastreo GPS en tiempo real",
          kind: "addon",
          is_active_for_tenant: true,
          member_codes: [],
          price_ea_cents: 14900,
          price_ga_cents: 27900,
          maturity: "beta",
        },
      ],
      commercial_summary: {
        plan_monthly_price_cents: 74900,
        modules_total_cents: 14900,
        overage_total_cents: 0,
        subtotal_cents: 89800,
        iva_cents: 14368,
        estimated_total_cents: 104168,
        currency: "MXN",
        period_key: "2026-07",
        billing_cycle: "monthly",
      },
    });

    expect(entitlements.directEntitlements[0]?.moduleCode).toBe(
      "gps_tracking",
    );
    expect(entitlements.directEntitlements[0]?.priceLockedCents).toBe(14900);
    expect(entitlements.commercialSummary.estimatedTotalCents).toBe(104168);
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

  it("mapBillingPaymentMethod maps masked SaaS card (WS-C)", () => {
    const pm = mapBillingPaymentMethod({
      id: "pm-1",
      tenant_id: "tenant-1",
      gateway: "stripe",
      gateway_payment_method_id: "pm_stripe_1",
      brand: "visa",
      last4: "4242",
      exp_month: 12,
      exp_year: 2030,
      is_default: true,
      created_at: "2026-09-01T12:00:00.000Z",
      updated_at: "2026-09-01T12:00:00.000Z",
    });

    expect(pm.tenantId).toBe("tenant-1");
    expect(pm.gatewayPaymentMethodId).toBe("pm_stripe_1");
    expect(pm.brand).toBe("visa");
    expect(pm.last4).toBe("4242");
    expect(pm.expMonth).toBe(12);
    expect(pm.isDefault).toBe(true);
  });

  it("mapBillingSetupIntent and mapSaasInvoicePayResult map pay / setup payloads", () => {
    const setup = mapBillingSetupIntent({
      client_secret: "seti_secret",
      customer_id: "cus_1",
      setup_intent_id: "seti_1",
    });
    expect(setup.clientSecret).toBe("seti_secret");
    expect(setup.setupIntentId).toBe("seti_1");

    const paid = mapSaasInvoicePayResult({
      saas_invoice_id: "inv-1",
      status: "paid",
      gateway_payment_id: "pi_1",
      amount_cents: 1000,
    });
    expect(paid.saasInvoiceId).toBe("inv-1");
    expect(paid.status).toBe("paid");
    expect(paid.amountCents).toBe(1000);

    const action = mapSaasInvoicePayResult({
      saas_invoice_id: "inv-2",
      status: "requires_action",
      gateway_payment_id: "pi_2",
      client_secret: "pi_secret",
    });
    expect(action.status).toBe("requires_action");
    expect(action.clientSecret).toBe("pi_secret");
  });
});
