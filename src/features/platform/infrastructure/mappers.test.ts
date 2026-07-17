import { describe, expect, it } from "vitest";
import {
  mapPlatformBillingPlan,
  mapPlatformMetrics,
  mapPlatformTenantDetail,
  mapPlatformTenantListItem,
  mapPlatformUser,
  mapPlatformAuditLogItem,
  mapPlatformTenantStampUsage,
  mapPlatformTenantEntitlements,
  mapPlatformModuleCatalogItem,
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
    });

    expect(user.platformRole).toBe("platform_owner");
    expect(user.firstName).toBe("Boeltech");
  });

  it("mapPlatformTenantListItem maps usage counters", () => {
    const item = mapPlatformTenantListItem({
      id: "t1",
      name: "Demo",
      subdomain: "demo",
      status: "active",
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
});
