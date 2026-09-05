import { describe, expect, it } from "vitest";
import { getPermissionsForRole } from "./rolePermissions";

describe("billing_service_concepts role permissions", () => {
  it("manager solo tiene read", () => {
    const perms = getPermissionsForRole("manager");
    expect(perms).toContain("billing_service_concepts.read");
    expect(perms).not.toContain("billing_service_concepts.create");
    expect(perms).not.toContain("billing_service_concepts.update");
    expect(perms).not.toContain("billing_service_concepts.delete");
  });

  it("accountant tiene CRUD", () => {
    const perms = getPermissionsForRole("accountant");
    expect(perms).toContain("billing_service_concepts.read");
    expect(perms).toContain("billing_service_concepts.create");
    expect(perms).toContain("billing_service_concepts.update");
    expect(perms).toContain("billing_service_concepts.delete");
  });

  it("dispatcher no tiene el módulo", () => {
    const perms = getPermissionsForRole("dispatcher");
    expect(perms).not.toContain("billing_service_concepts.read");
  });
});
