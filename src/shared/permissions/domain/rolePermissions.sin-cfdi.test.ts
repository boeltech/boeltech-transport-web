import { describe, expect, it } from "vitest";
import { ROLES } from "@shared/constants/roles";
import { checkPermission } from "./rules.js";
import { getAllRoles, getPermissionsForRole } from "./rolePermissions.js";

/** Lockstep API trips_settlement, operational_cash y fiscal_policy (B1). */
describe("gobierno Sin factura — permisos por rol", () => {
  const allowed = (
    role: (typeof ROLES)[keyof typeof ROLES],
    module: "trips_settlement" | "operational_cash" | "fiscal_policy",
    action: "request" | "update" | "approve" | "create" | "void" | "read",
  ) =>
    checkPermission(role, getPermissionsForRole(role), module, action).allowed;

  function roles(
    module: "trips_settlement" | "operational_cash" | "fiscal_policy",
    action: "request" | "update" | "approve" | "create" | "void" | "read",
  ) {
    return getAllRoles()
      .filter((role) => allowed(role, module, action))
      .sort();
  }

  it("pedir Sin factura: admin, gerente, despachador y operador", () => {
    expect(roles("trips_settlement", "request")).toEqual(
      [ROLES.ADMIN, ROLES.DISPATCHER, ROLES.MANAGER, ROLES.OPERATOR].sort(),
    );
  });

  it("regularizar y aprobar: admin, gerente y contador", () => {
    expect(roles("trips_settlement", "update")).toEqual(
      [ROLES.ACCOUNTANT, ROLES.ADMIN, ROLES.MANAGER].sort(),
    );
    expect(roles("trips_settlement", "approve")).toEqual(
      [ROLES.ACCOUNTANT, ROLES.ADMIN, ROLES.MANAGER].sort(),
    );
  });

  it("registrar abono: los cinco roles de patio; anular sin despachador ni operador", () => {
    expect(roles("operational_cash", "create")).toEqual(
      [
        ROLES.ACCOUNTANT,
        ROLES.ADMIN,
        ROLES.DISPATCHER,
        ROLES.MANAGER,
        ROLES.OPERATOR,
      ].sort(),
    );
    expect(roles("operational_cash", "void")).toEqual(
      [ROLES.ACCOUNTANT, ROLES.ADMIN, ROLES.MANAGER].sort(),
    );
  });

  it("leer política: admin, gerente y contador; cambiarla solo admin", () => {
    expect(roles("fiscal_policy", "read")).toEqual(
      [ROLES.ACCOUNTANT, ROLES.ADMIN, ROLES.MANAGER].sort(),
    );
    expect(roles("fiscal_policy", "update")).toEqual([ROLES.ADMIN]);
  });

  it("portal y conductor no piden, aprueban, regularizan ni anulan", () => {
    for (const role of [ROLES.DRIVER, ROLES.CLIENT]) {
      expect(allowed(role, "trips_settlement", "request")).toBe(false);
      expect(allowed(role, "trips_settlement", "update")).toBe(false);
      expect(allowed(role, "trips_settlement", "approve")).toBe(false);
      expect(allowed(role, "operational_cash", "void")).toBe(false);
    }
  });
});
