import { describe, expect, it } from "vitest";
import { Circle } from "lucide-react";
import { ROLES } from "@shared/constants/roles";
import { ROLE_DEFINITIONS } from "@shared/permissions/domain/rolePermissions";
import type { Module, Action } from "@shared/permissions/domain/entities";
import type { NavItem } from "./types";
import { navigationConfig } from "./navigation";
import { applyOperatorPaymentsNav, filterNavigation, findActiveNavItem } from "./useNavigation";
import { navigationCopy } from "../copy/navigationCopy";
import { COMPENSATION_HUB_PATH } from "@features/compensation/application/compensationRoutes";

const hub: NavItem = {
  id: "finance-hub",
  label: "Panorama",
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

  it("prefers the longest matching pathname", () => {
    expect(
      findActiveNavItem("/finance/approvals", [hub, approvals], "?status=pending")?.id,
    ).toBe("finance-approvals");
  });

  it("does not mark Panorama active on nested finance routes", () => {
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

  it("allows dispatcher to see reports group and read-only invoices without finance group", () => {
    const hasPermission = createPermissionChecker("dispatcher");
    const filtered = filterNavigation(navigationConfig, hasPermission, ROLES.DISPATCHER);
    const groupIds = filtered.map((g) => g.id);

    expect(groupIds).toContain("reports");
    expect(groupIds).toContain("billing");
    expect(groupIds).not.toContain("finance");

    const reportsGroup = filtered.find((g) => g.id === "reports");
    expect(reportsGroup?.items.map((i) => i.id)).toEqual(["reports-list"]);

    const billingGroup = filtered.find((g) => g.id === "billing");
    expect(billingGroup?.items.map((i) => i.id)).toEqual([
      "finance-invoices",
      "finance-dispatch-runs",
    ]);
  });

  it("allows accountant to see billing, finance and reports groups", () => {
    const hasPermission = createPermissionChecker("accountant");
    const filtered = filterNavigation(navigationConfig, hasPermission, ROLES.ACCOUNTANT);
    const groupIds = filtered.map((g) => g.id);

    expect(groupIds).toContain("billing");
    expect(groupIds).toContain("finance");
    expect(groupIds).toContain("reports");

    const billingGroup = filtered.find((g) => g.id === "billing");
    expect(billingGroup?.items.map((i) => i.id)).toEqual([
      "finance-invoiceable",
      "finance-invoices",
      "finance-cobros",
      "finance-dispatch-runs",
    ]);

    const financeGroup = filtered.find((g) => g.id === "finance");
    expect(financeGroup?.items.map((i) => i.id)).toEqual([
      "finance-hub",
      "finance-approvals",
      "finance-settlements",
      "finance-agreements",
      "finance-analysis",
    ]);
  });
});

describe("applyOperatorPaymentsNav", () => {
  it("no altera la nav cuando el flag está apagado", () => {
    expect(applyOperatorPaymentsNav(navigationConfig, false)).toBe(navigationConfig);
  });

  it("relabel Pagos a operadores, oculta Esquemas y cubre compensation", () => {
    const result = applyOperatorPaymentsNav(navigationConfig, true);
    const finance = result.find((g) => g.id === "finance");
    const ids = finance?.items.map((i) => i.id) ?? [];
    expect(ids).not.toContain("finance-agreements");
    const settlements = finance?.items.find((i) => i.id === "finance-settlements");
    expect(settlements?.label).toBe(navigationCopy.item.financeOperatorPayments);
    expect(settlements?.activePathPrefixes).toEqual([COMPENSATION_HUB_PATH]);
  });
});
