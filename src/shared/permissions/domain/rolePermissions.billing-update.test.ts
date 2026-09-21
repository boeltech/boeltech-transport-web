import { describe, it, expect } from "vitest";
import { getPermissionsForRole } from "./rolePermissions";
import { checkPermission } from "./rules";
import { ROLES } from "@shared/constants/roles";

describe("billing.update lockstep (Stripe-A WS-A)", () => {
  it("accountant has billing.read but not billing.update in role list", () => {
    const perms = getPermissionsForRole(ROLES.ACCOUNTANT);
    expect(perms).toContain("billing.read");
    expect(perms).not.toContain("billing.update");
  });

  it("admin bypass grants billing.update", () => {
    const result = checkPermission(ROLES.ADMIN, [], "billing", "update");
    expect(result.allowed).toBe(true);
    expect(result.source).toBe("admin");
  });

  it("accountant checkPermission denies billing.update", () => {
    const perms = getPermissionsForRole(ROLES.ACCOUNTANT);
    const result = checkPermission(
      ROLES.ACCOUNTANT,
      perms,
      "billing",
      "update",
    );
    expect(result.allowed).toBe(false);
  });
});
