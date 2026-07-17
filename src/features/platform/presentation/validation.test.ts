import { describe, expect, it } from "vitest";
import { createPlatformTenantSchema } from "./validation";

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
