import { describe, it, expect } from "vitest";
import type { UserRole } from "@shared/constants/roles";
import { getPermissionsForRole } from "./rolePermissions.js";
import { checkPermission } from "./rules.js";

/** Lockstep API `PERMISSIONS.gps_tracking` (pedido gps-tracking-monitoreo). */
const READ_ROLES: readonly UserRole[] = ["admin", "manager", "dispatcher"];
const EXECUTE_ROLES: readonly UserRole[] = ["admin", "manager"];
const ALL_ROLES: readonly UserRole[] = [
  "admin",
  "manager",
  "accountant",
  "dispatcher",
  "operator",
  "driver",
  "client",
];

function allows(role: UserRole, action: "read" | "execute"): boolean {
  return checkPermission(
    role,
    getPermissionsForRole(role),
    "gps_tracking",
    action,
  ).allowed;
}

describe("gps_tracking role permissions", () => {
  it.each(ALL_ROLES)("read para %s coincide con el API", (role) => {
    expect(allows(role, "read")).toBe(READ_ROLES.includes(role));
  });

  it.each(ALL_ROLES)("execute para %s coincide con el API", (role) => {
    expect(allows(role, "execute")).toBe(EXECUTE_ROLES.includes(role));
  });
});
