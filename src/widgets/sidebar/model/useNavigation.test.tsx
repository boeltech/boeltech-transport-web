import { describe, expect, it } from "vitest";
import { Circle } from "lucide-react";
import { ROLES } from "@shared/constants/roles";
import { ROLE_DEFINITIONS } from "@shared/permissions/domain/rolePermissions";
import type { Module, Action } from "@shared/permissions/domain/entities";
import type { NavItem } from "./types";
import { navigationConfig } from "./navigation";
import { filterNavigation, findActiveNavItem } from "./useNavigation";
import { navigationCopy } from "../copy/navigationCopy";
import { COMPENSATION_HUB_PATH } from "@features/compensation/application";

const hub: NavItem = {
  id: "finance-hub",
  label: "Cartera",
  path: "/finance",
  icon: Circle,
  exactPath: true,
};
const invoiceable: NavItem = {
  id: "finance-invoiceable",
  label: "Por facturar",
  path: "/finance/invoiceable",
  icon: Circle,
};
const cobros: NavItem = {
  id: "finance-cobros",
  label: "Cobros",
  path: "/finance/cobros",
  icon: Circle,
};
const dispatch: NavItem = {
  id: "finance-dispatch",
  label: "Envíos",
  path: "/finance/dispatch",
  icon: Circle,
};
const approvals: NavItem = {
  id: "finance-approvals",
  label: "Aprobaciones",
  path: "/finance/approvals",
  icon: Circle,
};
const users: NavItem = {
  id: "users",
  label: "Usuarios",
  path: "/users",
  icon: Circle,
};
const usersActivity: NavItem = {
  id: "users-activity",
  label: "Historial de usuarios",
  path: "/users/activity",
  icon: Circle,
};

describe("findActiveNavItem", () => {
  it("activates finance sections by pathname", () => {
    expect(findActiveNavItem("/finance/invoiceable", [hub, invoiceable], "")?.id).toBe(
      "finance-invoiceable",
    );
    expect(findActiveNavItem("/finance/cobros", [hub, cobros], "")?.id).toBe(
      "finance-cobros",
    );
    expect(findActiveNavItem("/finance", [hub, invoiceable], "")?.id).toBe(
      "finance-hub",
    );
  });

  it("activa Facturas en /invoices/new y /invoices/:id", () => {
    const invoices: NavItem = {
      id: "finance-invoices",
      label: "Facturas",
      path: "/finance/invoices",
      icon: Circle,
      activePathPrefixes: ["/invoices"],
    };
    expect(findActiveNavItem("/invoices/new", [hub, invoices], "")?.id).toBe(
      "finance-invoices",
    );
    expect(
      findActiveNavItem("/invoices/inv-1", [hub, invoices], "")?.id,
    ).toBe("finance-invoices");
    expect(findActiveNavItem("/finance/invoices", [hub, invoices], "")?.id).toBe(
      "finance-invoices",
    );
  });

  it("prefers the longest matching pathname", () => {
    expect(
      findActiveNavItem("/finance/approvals", [hub, approvals], "?status=pending")?.id,
    ).toBe("finance-approvals");
  });

  it("keeps Envíos active on period list and run detail", () => {
    expect(
      findActiveNavItem("/finance/dispatch", [hub, dispatch], "")?.id,
    ).toBe("finance-dispatch");
    expect(
      findActiveNavItem("/finance/dispatch/period", [hub, dispatch], "")?.id,
    ).toBe("finance-dispatch");
    expect(
      findActiveNavItem("/finance/dispatch/run-1", [hub, dispatch], "")?.id,
    ).toBe("finance-dispatch");
  });

  it("does not mark Cartera active on nested finance routes", () => {
    expect(findActiveNavItem("/finance/cobros", [hub, cobros], "")?.id).toBe(
      "finance-cobros",
    );
    expect(findActiveNavItem("/finance/cobros", [hub, invoiceable], "")).toBeUndefined();
  });

  it("still wins by longest pathname over shorter siblings", () => {
    const active = findActiveNavItem(
      "/users/activity",
      [users, usersActivity, hub],
      "",
    );

    expect(active?.id).toBe("users-activity");
  });
});

describe("filterNavigation", () => {
  const createPermissionChecker = (role: keyof typeof ROLE_DEFINITIONS) => {
    const permissions = new Set(ROLE_DEFINITIONS[role].permissions);
    return (module: Module, action: Action) => {
      if (role === "admin") return true;
      return permissions.has(`${module}.${action}` as const);
    };
  };

  it("allows dispatcher to see Reportes under finance and read-only invoices in billing", () => {
    const hasPermission = createPermissionChecker("dispatcher");
    const filtered = filterNavigation(navigationConfig, hasPermission, ROLES.DISPATCHER);
    const groupIds = filtered.map((g) => g.id);

    expect(groupIds).not.toContain("reports");
    expect(groupIds).toContain("billing");
    expect(groupIds).toContain("finance");

    const financeGroup = filtered.find((g) => g.id === "finance");
    expect(financeGroup?.items.map((i) => i.id)).toEqual(["reports-list"]);

    const billingGroup = filtered.find((g) => g.id === "billing");
    expect(billingGroup?.items.map((i) => i.id)).toEqual(["finance-invoices"]);
  });

  it("shows fleet documents when user has vehicles.read or drivers.read", () => {
    const withVehicles = filterNavigation(
      navigationConfig,
      (module, action) => module === "vehicles" && action === "read",
      ROLES.DISPATCHER,
    );
    const fleetWithVehicles = withVehicles.find((g) => g.id === "fleet");
    expect(fleetWithVehicles?.items.map((i) => i.id)).toContain(
      "fleet-documents",
    );

    const withDriversOnly = filterNavigation(
      navigationConfig,
      (module, action) => module === "drivers" && action === "read",
      ROLES.DISPATCHER,
    );
    const fleetWithDrivers = withDriversOnly.find((g) => g.id === "fleet");
    expect(fleetWithDrivers?.items.map((i) => i.id)).toEqual([
      "drivers",
      "fleet-documents",
    ]);

    const withNeither = filterNavigation(
      navigationConfig,
      () => false,
      ROLES.CLIENT,
    );
    expect(withNeither.find((g) => g.id === "fleet")).toBeUndefined();
  });

  it("allows accountant to see billing and finance (Reportes as finance item)", () => {
    const hasPermission = createPermissionChecker("accountant");
    const filtered = filterNavigation(navigationConfig, hasPermission, ROLES.ACCOUNTANT);
    const groupIds = filtered.map((g) => g.id);

    expect(groupIds).toContain("billing");
    expect(groupIds).toContain("finance");
    expect(groupIds).not.toContain("reports");

    const billingGroup = filtered.find((g) => g.id === "billing");
    expect(billingGroup?.items.map((i) => i.id)).toEqual([
      "finance-invoiceable",
      "finance-invoices",
      "finance-dispatch",
      "finance-cobros",
    ]);

    const financeGroup = filtered.find((g) => g.id === "finance");
    expect(financeGroup?.items.map((i) => i.id)).toEqual([
      "finance-hub",
      "finance-approvals",
      "finance-settlements",
      "finance-analysis",
      "reports-list",
    ]);
  });

  it("declara Pagos a operadores directo con cobertura del hub compensación", () => {
    const settlements = navigationConfig
      .find((g) => g.id === "finance")
      ?.items.find((i) => i.id === "finance-settlements");
    expect(settlements?.label).toBe(navigationCopy.item.financeOperatorPayments);
    expect(settlements?.activePathPrefixes).toEqual([COMPENSATION_HUB_PATH]);
    expect(
      navigationConfig
        .find((g) => g.id === "finance")
        ?.items.some((i) => i.id === "finance-agreements"),
    ).toBe(false);
  });

  it("oculta Envíos (dispatch) al dispatcher — alineado al RoleRoute", () => {
    const hasPermission = createPermissionChecker("dispatcher");
    const filtered = filterNavigation(
      navigationConfig,
      hasPermission,
      ROLES.DISPATCHER,
    );
    const billing = filtered.find((g) => g.id === "billing");
    expect(billing?.items.map((i) => i.id)).not.toContain("finance-dispatch");
  });
});
