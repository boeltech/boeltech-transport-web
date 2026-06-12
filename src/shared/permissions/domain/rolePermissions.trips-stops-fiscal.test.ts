import { describe, it, expect } from "vitest";
import { getPermissionsForRole } from "./rolePermissions.js";

describe("trips_stops_fiscal role permissions", () => {
  it("includes execute for manager and accountant", () => {
    for (const role of ["manager", "accountant"] as const) {
      const perms = getPermissionsForRole(role);
      expect(perms).toContain("trips_stops_fiscal.execute");
    }
  });

  it("excludes trips_stops_fiscal from operator", () => {
    const perms = getPermissionsForRole("operator");
    expect(perms).not.toContain("trips_stops_fiscal.execute");
  });
});
