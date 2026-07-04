import { describe, it, expect } from "vitest";
import { getPermissionsForRole } from "./rolePermissions.js";

describe("trips_fiscal_edit role permissions", () => {
  it("includes execute for manager and accountant", () => {
    for (const role of ["manager", "accountant"] as const) {
      const perms = getPermissionsForRole(role);
      expect(perms).toContain("trips_fiscal_edit.execute");
    }
  });

  it("excludes trips_fiscal_edit from operator", () => {
    const perms = getPermissionsForRole("operator");
    expect(perms).not.toContain("trips_fiscal_edit.execute");
  });
});
