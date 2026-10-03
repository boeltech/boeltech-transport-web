import { describe, it, expect } from "vitest";
import { ROLES } from "@shared/constants/roles";
import { checkPermission } from "./rules.js";
import { getAllRoles, getPermissionsForRole } from "./rolePermissions.js";

/** Lockstep API `PERMISSIONS.approval_policies` (ADR-0099). */
describe("approval_policies role permissions", () => {
  const allowed = (role: (typeof ROLES)[keyof typeof ROLES], action: "read" | "update") =>
    checkPermission(role, getPermissionsForRole(role), "approval_policies", action).allowed;

  it("read: admin, manager, accountant", () => {
    const readers = getAllRoles().filter((role) => allowed(role, "read"));
    expect(readers.sort()).toEqual([ROLES.ACCOUNTANT, ROLES.ADMIN, ROLES.MANAGER].sort());
  });

  it("update: solo admin", () => {
    const editors = getAllRoles().filter((role) => allowed(role, "update"));
    expect(editors).toEqual([ROLES.ADMIN]);
  });
});
