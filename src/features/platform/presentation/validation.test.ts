import { describe, expect, it } from "vitest";
import {
  assignPlatformPlanSchema,
  createPlatformTenantSchema,
  issueSaasInvoiceSchema,
  markSaasInvoicePaidSchema,
  matchesTypedTenantConfirmation,
  typedSuspendPlatformTenantSchema,
} from "./validation";
import {
  getLastClosedMexicoCityPeriodKey,
  getMexicoCityPeriodKey,
} from "./utils/billingPeriod";

const validBase = {
  companyName: "Transportes Demo",
  subdomain: "demo-transporte",
  adminEmail: "admin@demo.com",
  adminPassword: "SecurePass1!",
  adminFirstName: "Ana",
  adminLastName: "López",
  planCode: "operacion_esencial",
};

describe("createPlatformTenantSchema", () => {
  it("accepts valid tenant payload", () => {
    const result = createPlatformTenantSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("accepts optional fleet band", () => {
    const result = createPlatformTenantSchema.safeParse({
      ...validBase,
      planCode: "operacion_crecimiento",
      declaredFleetBand: "11_30",
    });
    expect(result.success).toBe(true);
  });

  it("normalizes subdomain to lowercase", () => {
    const result = createPlatformTenantSchema.safeParse({
      ...validBase,
      subdomain: "Demo-Transporte",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.subdomain).toBe("demo-transporte");
    }
  });

  it("rejects subdomain with leading or trailing hyphen", () => {
    expect(
      createPlatformTenantSchema.safeParse({
        ...validBase,
        subdomain: "-demo",
      }).success,
    ).toBe(false);
    expect(
      createPlatformTenantSchema.safeParse({
        ...validBase,
        subdomain: "demo-",
      }).success,
    ).toBe(false);
  });

  it("rejects weak admin password", () => {
    const result = createPlatformTenantSchema.safeParse({
      ...validBase,
      adminPassword: "password",
    });
    expect(result.success).toBe(false);
  });
});

describe("issueSaasInvoiceSchema", () => {
  it("accepts YYYY-MM and defaults dueDays", () => {
    const result = issueSaasInvoiceSchema.safeParse({
      periodKey: getLastClosedMexicoCityPeriodKey(),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dueDays).toBe(14);
      expect(result.data.status).toBe("open");
    }
  });

  it("accepts draft status", () => {
    const result = issueSaasInvoiceSchema.safeParse({
      periodKey: getLastClosedMexicoCityPeriodKey(),
      status: "draft",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("draft");
    }
  });

  it("rejects invalid period_key", () => {
    expect(
      issueSaasInvoiceSchema.safeParse({ periodKey: "2026-7" }).success,
    ).toBe(false);
  });

  it("rejects the open CDMX month", () => {
    const result = issueSaasInvoiceSchema.safeParse({
      periodKey: getMexicoCityPeriodKey(),
    });
    expect(result.success).toBe(false);
  });
});

describe("markSaasInvoicePaidSchema", () => {
  it("requires paidAt and method", () => {
    expect(
      markSaasInvoicePaidSchema.safeParse({
        paidAt: "2026-08-03T12:00",
        method: "spei",
      }).success,
    ).toBe(true);
    expect(
      markSaasInvoicePaidSchema.safeParse({ method: "spei" }).success,
    ).toBe(false);
  });
});

describe("typedSuspendPlatformTenantSchema", () => {
  it("requires reasonDetail when reasonCode is other", () => {
    expect(
      typedSuspendPlatformTenantSchema.safeParse({
        reasonCode: "other",
        confirmation: "acme",
        reasonDetail: "",
      }).success,
    ).toBe(false);
    expect(
      typedSuspendPlatformTenantSchema.safeParse({
        reasonCode: "past_due_policy",
        confirmation: "acme",
      }).success,
    ).toBe(true);
    expect(
      typedSuspendPlatformTenantSchema.safeParse({
        reasonCode: "other",
        confirmation: "acme",
        reasonDetail: "Cliente pidió baja temporal",
      }).success,
    ).toBe(true);
  });
});

describe("matchesTypedTenantConfirmation", () => {
  const tenant = { name: "Acme Transportes", subdomain: "acme-mx" };

  it("matches subdomain or name case-insensitively", () => {
    expect(matchesTypedTenantConfirmation("acme-mx", tenant)).toBe(true);
    expect(matchesTypedTenantConfirmation("ACME Transportes", tenant)).toBe(
      true,
    );
    expect(matchesTypedTenantConfirmation("otro", tenant)).toBe(false);
  });
});

describe("assignPlatformPlanSchema", () => {
  it("requires reason 10–500", () => {
    expect(
      assignPlatformPlanSchema.safeParse({
        planCode: "operacion_crecimiento",
        reason: "corto",
      }).success,
    ).toBe(false);
    expect(
      assignPlatformPlanSchema.safeParse({
        planCode: "operacion_crecimiento",
        reason: "Upgrade solicitado por deal desk",
      }).success,
    ).toBe(true);
  });
});
