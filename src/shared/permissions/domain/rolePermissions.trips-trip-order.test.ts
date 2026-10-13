import { describe, it, expect } from "vitest";
import type { UserRole } from "@shared/constants/roles";
import { getPermissionsForRole } from "./rolePermissions.js";
import { checkPermission } from "./rules.js";

/** Lockstep con API `PERMISSIONS.trips_trip_order` (pedido 2026-10-12-orden-de-viaje). */
const READ_ROLES: readonly UserRole[] = [
  "admin",
  "manager",
  "dispatcher",
  "operator",
  "accountant",
];
const EXECUTE_ROLES: readonly UserRole[] = [
  "admin",
  "manager",
  "dispatcher",
  "operator",
];
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
    "trips_trip_order",
    action,
  ).allowed;
}

describe("trips_trip_order role permissions", () => {
  it.each(ALL_ROLES)("read para %s coincide con el API", (role) => {
    expect(allows(role, "read")).toBe(READ_ROLES.includes(role));
  });

  it.each(ALL_ROLES)("execute para %s coincide con el API", (role) => {
    expect(allows(role, "execute")).toBe(EXECUTE_ROLES.includes(role));
  });

  it("driver y client no ven la tarjeta (sin read)", () => {
    expect(getPermissionsForRole("driver")).not.toContain("trips_trip_order.read");
    expect(getPermissionsForRole("client")).not.toContain("trips_trip_order.read");
  });

  it("accountant descarga pero no genera", () => {
    expect(allows("accountant", "read")).toBe(true);
    expect(allows("accountant", "execute")).toBe(false);
  });
});
