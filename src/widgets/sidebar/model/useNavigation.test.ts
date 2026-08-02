import { describe, expect, it } from "vitest";
import { Circle } from "lucide-react";
import type { NavItem } from "./types";
import { findActiveNavItem } from "./useNavigation";

const hub: NavItem = {
  id: "finance-hub",
  label: "Finanzas",
  path: "/finance",
  icon: Circle,
};
const invoiceable: NavItem = {
  id: "finance-invoiceable",
  label: "Por facturar",
  path: "/finance?tab=invoiceable",
  icon: Circle,
};
const approvals: NavItem = {
  id: "finance-approvals",
  label: "Aprobaciones",
  path: "/finance?tab=approvals",
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
  it("prefers the item whose tab matches the current query", () => {
    const active = findActiveNavItem(
      "/finance",
      [hub, invoiceable, approvals],
      "?tab=invoiceable",
    );

    expect(active?.id).toBe("finance-invoiceable");
  });

  it("keeps the hub active when the tab does not match", () => {
    expect(
      findActiveNavItem("/finance", [hub, invoiceable], "")?.id,
    ).toBe("finance-hub");
    expect(
      findActiveNavItem("/finance", [hub, invoiceable], "?tab=cobros")?.id,
    ).toBe("finance-hub");
  });

  it("activates a tab item even without query when it is the only one visible", () => {
    expect(findActiveNavItem("/finance", [invoiceable], "")?.id).toBe(
      "finance-invoiceable",
    );
  });

  it("distinguishes sibling tabs of the same hub", () => {
    expect(
      findActiveNavItem(
        "/finance",
        [hub, invoiceable, approvals],
        "?tab=approvals&status=pending",
      )?.id,
    ).toBe("finance-approvals");
  });

  it("still wins by longest pathname over any query match", () => {
    const active = findActiveNavItem(
      "/users/activity",
      [users, usersActivity, hub],
      "?tab=approvals",
    );

    expect(active?.id).toBe("users-activity");
  });
});
