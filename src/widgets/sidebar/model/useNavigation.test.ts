import { describe, expect, it } from "vitest";
import { Circle } from "lucide-react";
import type { NavItem } from "./types";
import { findActiveNavItem } from "./useNavigation";

const hub: NavItem = {
  id: "finance-hub",
  label: "Resumen",
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

  it("does not mark Resumen active on nested finance routes", () => {
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
