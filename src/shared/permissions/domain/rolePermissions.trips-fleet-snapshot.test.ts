import { describe, it, expect } from "vitest";
import type { UserRole } from "@shared/constants/roles";
import { getPermissionsForRole } from "./rolePermissions.js";
import { checkPermission } from "./rules.js";

/** Lockstep con API `PERMISSIONS.trips_fleet_snapshot` (pedido cp31-autotransporte-por-viaje, G4). */
const READ_ROLES: readonly UserRole[] = ["admin", "manager", "dispatcher", "accountant"];
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
    "trips_fleet_snapshot",
    action,
  ).allowed;
}

describe("trips_fleet_snapshot role permissions", () => {
  it.each(ALL_ROLES)("read para %s coincide con el API", (role) => {
    expect(allows(role, "read")).toBe(READ_ROLES.includes(role));
  });

  it.each(ALL_ROLES)("execute para %s coincide con el API", (role) => {
    expect(allows(role, "execute")).toBe(EXECUTE_ROLES.includes(role));
  });

  it("operator no ve la tarjeta (sin read)", () => {
    expect(getPermissionsForRole("operator")).not.toContain("trips_fleet_snapshot.read");
  });
});
