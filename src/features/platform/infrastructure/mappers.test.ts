import { describe, expect, it } from "vitest";
import {
  mapPlatformBillingPlan,
  mapPlatformMetrics,
  mapPlatformTenantDetail,
  mapPlatformTenantListItem,
  mapPlatformUser,
  mapPlatformAuditLogItem,
  mapPlatformTenantStampUsage,
  mapPlatformTenantSubscription,
  mapPlatformTenantEntitlements,
  mapPlatformModuleCatalogItem,
  mapPlatformSaasArRow,
  mapPlatformReconciliationPreview,
  toApiCreatePlatformTenant,
} from "./mappers";
import type { ApiBillingUsage } from "@features/billing/infrastructure/mappers";

describe("platform mappers", () => {
  it("mapPlatformUser converts snake_case API user", () => {
    const user = mapPlatformUser({
      id: "u1",
      email: "owner@boeltech.com",
      first_name: "Boeltech",
      last_name: "Owner",
      platform_role: "platform_owner",
      scope: "platform",
      mfa_enabled: false,
      mfa_enabled_at: null,
    });

    expect(user.platformRole).toBe("platform_owner");
    expect(user.firstName).toBe("Boeltech");
    expect(user.mfaEnabled).toBe(false);
  });

  it("isApiPlatformMfaChallenge detects MFA challenge payloads", async () => {
    const { isApiPlatformMfaChallenge } = await import("./mappers");
    expect(
      isApiPlatformMfaChallenge({
        needs_mfa: true,
        mfa_challenge_token: "tok",
        mfa_challenge_expires_at: "2026-01-01T00:00:00.000Z",
      }),
    ).toBe(true);
    expect(
      isApiPlatformMfaChallenge({
        access_token: "a",
        refresh_token: "r",
        user: {
          id: "u1",
          email: "a@b.c",
          first_name: "A",
          last_name: "B",
          platform_role: "platform_owner",
          scope: "platform",
        },
      }),
    ).toBe(false);
  });

  it("mapPlatformTenantListItem maps usage counters", () => {
    const item = mapPlatformTenantListItem({
      id: "t1",
      name: "Demo",
      subdomain: "demo",
      status: "active",
      subscription_status: "past_due",
      plan_code: "operacion_esencial",
      plan_name: "Operación Esencial",
      user_count: 2,
      branch_count: 1,
      trip_count: 5,
      created_at: "2026-06-01T12:00:00.000Z",
      suspended_at: null,
    });

    expect(item.planCode).toBe("operacion_esencial");
    expect(item.tripCount).toBe(5);
    expect(item.subscriptionStatus).toBe("past_due");
    expect(item.declaredFleetBand).toBeNull();
  });

  it("mapPlatformTenantListItem maps declared fleet", () => {
    const item = mapPlatformTenantListItem({
      id: "t1",
      name: "Demo",
      subdomain: "demo",
      status: "active",
      plan_code: "operacion_crecimiento",
      plan_name: "Operación Crecimiento",
      declared_fleet_band: "11_30",
      declared_fleet_units: 20,
      user_count: 2,
      branch_count: 1,
      trip_count: 5,
      created_at: "2026-06-01T12:00:00.000Z",
      suspended_at: null,
    });

    expect(item.declaredFleetBand).toBe("11_30");
    expect(item.declaredFleetUnits).toBe(20);
  });

  it("mapPlatformTenantDetail prefers usage block", () => {
    const detail = mapPlatformTenantDetail({
      id: "t1",
      name: "Demo",
      subdomain: "demo",
      status: "suspended",
      plan_code: null,
      plan_name: null,
      user_count: 1,
      branch_count: 0,
      trip_count: 0,
      created_at: "2026-06-01T12:00:00.000Z",
      suspended_at: "2026-07-01T12:00:00.000Z",
      usage: { user_count: 3, branch_count: 2, trip_count: 10 },
    });

    expect(detail.usage.userCount).toBe(3);
    expect(detail.status).toBe("suspended");
    expect(detail.adminActivation).toBeNull();
  });

  it("mapAdminActivation and detail map admin_activation", async () => {
    const { mapAdminActivation, mapCreatePlatformTenantResult } =
      await import("./mappers");
    const activation = mapAdminActivation({
      status: "pending",
      email: "admin@demo.mx",
      expires_at: "2026-08-14T18:00:00.000Z",
      last_sent_at: "2026-08-07T18:00:00.000Z",
      last_send_error: null,
      send_attempts: 1,
    });
    expect(activation).toEqual({
      status: "pending",
      email: "admin@demo.mx",
      expiresAt: "2026-08-14T18:00:00.000Z",
      lastSentAt: "2026-08-07T18:00:00.000Z",
      lastSendError: null,
      sendAttempts: 1,
    });

    const detail = mapPlatformTenantDetail({
      id: "t1",
      name: "Demo",
      subdomain: "demo",
      status: "active",
      plan_code: "operacion_esencial",
      plan_name: "Operación Esencial",
      user_count: 1,
      branch_count: 0,
      trip_count: 0,
      created_at: "2026-08-07T18:00:00.000Z",
      suspended_at: null,
      admin_activation: {
        status: "email_failed",
        email: "admin@demo.mx",
        expires_at: "2026-08-14T18:00:00.000Z",
        last_sent_at: "2026-08-07T18:00:00.000Z",
        last_send_error: "EMAIL_SEND_FAILED",
        send_attempts: 1,
      },
    });
    expect(detail.adminActivation?.status).toBe("email_failed");
    expect(detail.adminActivation?.lastSendError).toBe("EMAIL_SEND_FAILED");

    const created = mapCreatePlatformTenantResult({
      tenant: {
        id: "t1",
        name: "Demo",
        subdomain: "demo",
        status: "active",
        plan_code: "operacion_esencial",
        plan_name: "Operación Esencial",
        user_count: 1,
        branch_count: 0,
        trip_count: 0,
        created_at: "2026-08-07T18:00:00.000Z",
        suspended_at: null,
      },
      admin: {
        id: "u1",
        email: "admin@demo.mx",
        first_name: "Ada",
        last_name: "Admin",
        role: "admin",
        status: "pending_activation",
      },
      admin_activation: {
        status: "pending",
        email: "admin@demo.mx",
        expires_at: "2026-08-14T18:00:00.000Z",
        last_sent_at: "2026-08-07T18:00:00.000Z",
        last_send_error: null,
        send_attempts: 1,
      },
    });
    expect(created.admin.firstName).toBe("Ada");
    expect(created.adminActivation.status).toBe("pending");
    expect(created.tenant.subdomain).toBe("demo");
  });

  it("mapPlatformMetrics maps KPI fields", () => {
    const metrics = mapPlatformMetrics({
      total_tenants: 10,
      active_tenants: 8,
      suspended_tenants: 2,
      tenants_by_plan: { operacion_esencial: 7 },
      total_users: 40,
      tenants_created_last_30_days: 1,
    });

    expect(metrics.totalTenants).toBe(10);
    expect(metrics.tenantsByPlan.operacion_esencial).toBe(7);
  });

  it("mapPlatformBillingPlan maps limits and commercial fields", () => {
    const plan = mapPlatformBillingPlan({
      code: "operacion_esencial",
      name: "Operación Esencial",
      max_users: 3,
      max_branches: 1,
      history_months: 6,
      is_active: true,
      monthly_price_cents: 74900,
      annual_price_cents: 763980,
      included_stamps: 120,
      overage_price_cents: 600,
      quota_policy: "soft_cap",
      features: { support_tier: "email" },
    });

    expect(plan.maxUsers).toBe(3);
    expect(plan.monthlyPriceCents).toBe(74900);
    expect(plan.includedStamps).toBe(120);
    expect(plan.quotaPolicy).toBe("soft_cap");
    expect(plan.pricePerMotrizCents).toBeNull();
    expect(plan.stampsPerMotriz).toBe(30);
    expect(plan.bandQMin).toBeNull();
    expect(plan.bandQMax).toBeNull();
  });

  it("mapPlatformBillingPlan maps SoT v5 motriz fields", () => {
    const plan = mapPlatformBillingPlan({
      code: "operacion_pequena",
      name: "Operación Pequeña",
      max_users: 10,
      max_branches: 3,
      history_months: 12,
      is_active: true,
      monthly_price_cents: 0,
      annual_price_cents: null,
      included_stamps: 0,
      overage_price_cents: 600,
      quota_policy: "soft_cap",
      features: {},
      price_per_motriz_cents: 31900,
      stamps_per_motriz: 30,
      band_q_min: 6,
      band_q_max: 30,
    });

    expect(plan.monthlyPriceCents).toBe(0);
    expect(plan.pricePerMotrizCents).toBe(31900);
    expect(plan.stampsPerMotriz).toBe(30);
    expect(plan.bandQMin).toBe(6);
    expect(plan.bandQMax).toBe(30);
  });

  it("toApiCreatePlatformTenant serializes admin names", () => {
    const body = toApiCreatePlatformTenant({
      company: { name: "Acme", subdomain: "acme" },
      admin: {
        email: "a@acme.com",
        password: "Secret123!",
        firstName: "Ana",
        lastName: "López",
      },
      planCode: "operacion_esencial",
      declaredFleetBand: "11_30",
    });

    expect(body.admin.first_name).toBe("Ana");
    expect(body.plan_code).toBe("operacion_esencial");
    expect(body.declared_fleet_band).toBe("11_30");
  });

  it("mapPlatformAuditLogItem maps snake_case audit entry", () => {
    const item = mapPlatformAuditLogItem({
      id: "a1",
      platform_user_id: "u1",
      platform_user_email: "ops@boeltech.com",
      action: "tenant_status_changed",
      target_tenant_id: "t1",
      target_type: "tenant",
      target_id: "t1",
      metadata: { previous_status: "active", status: "suspended" },
      created_at: "2026-07-04T18:00:00.000Z",
    });

    expect(item.platformUserEmail).toBe("ops@boeltech.com");
    expect(item.targetTenantId).toBe("t1");
    expect(item.metadata.status).toBe("suspended");
  });

  it("mapPlatformTenantStampUsage maps stamp usage fields", () => {
    const usage = mapPlatformTenantStampUsage({
      tenant_id: "t1",
      plan_code: "operacion_esencial",
      period_key: "2026-07",
      current_period_start: "2026-07-01T00:00:00.000Z",
      current_period_end: "2026-07-31T23:59:59.999Z",
      included_stamps: 120,
      stamps_used: 40,
      overage_stamps: 0,
      overage_price_cents: 600,
      overage_total_cents: 0,
      quota_policy: "soft_cap",
      history: [],
    } satisfies ApiBillingUsage);

    expect(usage.includedStamps).toBe(120);
    expect(usage.stampsUsed).toBe(40);
  });

  it("mapPlatformTenantSubscription exposes SoT v5 motriz + ADR-0095 capacity", () => {
    const sub = mapPlatformTenantSubscription({
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
      pending_capacity_band_code: null,
      limits: {
        max_users: 10,
        max_branches: 3,
        history_months: 12,
      },
      capacity: {
        band_code: "operacion_pequena",
        pending_band_code: null,
        users: {
          granted: 10,
          usage: 4,
          limit_reached: false,
          over_quota: false,
          over_quota_count: 0,
          status: "within_limit",
        },
        branches: {
          granted: 3,
          usage: 1,
          limit_reached: false,
          over_quota: false,
          over_quota_count: 0,
          status: "within_limit",
        },
        history_months: { granted: 12 },
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
    expect(sub.capacityBandCode).toBe("operacion_pequena");
    expect(sub.pendingCapacityBandCode).toBeNull();
    expect(sub.capacity.users.status).toBe("within_limit");
    expect(sub.capacity.users.granted).toBe(10);
  });

  it("mapPlatformTenantEntitlements delegates to billing mapper", () => {
    const entitlements = mapPlatformTenantEntitlements({
      direct_entitlements: [],
      effective_module_codes: ["fuel_management"],
      profitability_level: "L2",
      catalog: [],
      commercial_summary: {
        plan_monthly_price_cents: 149900,
        modules_total_cents: 0,
        overage_total_cents: 0,
        subtotal_cents: 149900,
        iva_cents: 23984,
        estimated_total_cents: 173884,
        currency: "MXN",
        period_key: "2026-07",
        billing_cycle: "monthly",
      },
    });

    expect(entitlements.profitabilityLevel).toBe("L2");
    expect(entitlements.effectiveModuleCodes).toEqual(["fuel_management"]);
    expect(entitlements.commercialSummary.planMonthlyPriceCents).toBe(149900);
  });

  it("mapPlatformModuleCatalogItem maps catalog row", () => {
    const item = mapPlatformModuleCatalogItem({
      code: "pack_costo_vehicular",
      name: "Pack costo vehicular",
      kind: "pack",
      price_ea_cents: null,
      price_ga_cents: 150000,
      member_codes: ["fuel_management", "maintenance"],
    });

    expect(item.memberCodes).toHaveLength(2);
    expect(item.priceGaCents).toBe(150000);
  });

  it("mapPlatformSaasArRow maps cartera fields", () => {
    const row = mapPlatformSaasArRow({
      id: "inv-1",
      tenant_id: "t1",
      subscription_id: "sub-1",
      period_key: "2026-07",
      period_start: "2026-07-01T06:00:00.000Z",
      period_end: "2026-08-01T06:00:00.000Z",
      status: "open",
      currency: "MXN",
      plan_code: "operacion_crecimiento",
      stamps_included: 380,
      stamps_used: 400,
      stamps_overage: 20,
      subtotal_cents: 167700,
      tax_cents: 26832,
      total_cents: 194532,
      amount_due_cents: 194532,
      amount_paid_cents: 0,
      issued_at: "2026-08-01T16:00:00.000Z",
      due_date: "2026-08-15T16:00:00.000Z",
      paid_at: null,
      voided_at: null,
      void_reason: null,
      notes: null,
      days_overdue: 3,
      created_at: "2026-08-01T16:00:00.000Z",
      updated_at: "2026-08-01T16:00:00.000Z",
      tenant_name: "Demo SA",
      subdomain: "demo",
      subscription_status: "past_due",
    });

    expect(row.tenantName).toBe("Demo SA");
    expect(row.daysOverdue).toBe(3);
    expect(row.totalCents).toBe(194532);
  });

  it("mapPlatformReconciliationPreview maps totals", () => {
    const preview = mapPlatformReconciliationPreview({
      tenant_id: "t1",
      tenant_name: "Demo",
      subdomain: "demo",
      period_key: "2026-07",
      plan_code: "operacion_crecimiento",
      plan_name: "Operación Crecimiento",
      monthly_price_cents: 149900,
      billing_cycle: "monthly",
      status: "active",
      included_stamps: 380,
      stamps_used: 10,
      overage_stamps: 0,
      overage_price_cents: 400,
      overage_total_cents: 0,
      active_modules: [],
      modules_total_cents: 0,
      subtotal_cents: 149900,
      iva_cents: 23984,
      total_cents: 173884,
    });

    expect(preview.periodKey).toBe("2026-07");
    expect(preview.totalCents).toBe(173884);
  });
});
