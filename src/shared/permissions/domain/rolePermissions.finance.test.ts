import { describe, expect, it } from "vitest";
import { getPermissionsForRole } from "./rolePermissions.js";

describe("finance role permissions (Análisis + Cobros lockstep)", () => {
  it("includes finance.read and finance.create for manager and accountant", () => {
    for (const role of ["manager", "accountant"] as const) {
      const perms = getPermissionsForRole(role);
      expect(perms).toContain("finance.read");
      expect(perms).toContain("finance.create");
    }
  });

  it("excludes finance permissions from dispatcher", () => {
    const perms = getPermissionsForRole("dispatcher");
    expect(perms).not.toContain("finance.read");
    expect(perms).not.toContain("finance.create");
  });

  it("excludes finance permissions from client portal role", () => {
    const perms = getPermissionsForRole("client");
    expect(perms).not.toContain("finance.read");
    expect(perms).not.toContain("finance.create");
  });
});
