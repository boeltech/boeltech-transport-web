import { describe, it, expect } from "vitest";
import { getPermissionsForRole } from "./rolePermissions.js";

describe("finance_approvals role permissions", () => {
  it("includes read/update for manager and accountant", () => {
    for (const role of ["manager", "accountant"] as const) {
      const perms = getPermissionsForRole(role);
      expect(perms).toContain("finance_approvals.read");
      expect(perms).toContain("finance_approvals.update");
    }
  });

  it("excludes finance_approvals from operator", () => {
    const perms = getPermissionsForRole("operator");
    expect(perms).not.toContain("finance_approvals.read");
    expect(perms).not.toContain("finance_approvals.update");
  });
});
