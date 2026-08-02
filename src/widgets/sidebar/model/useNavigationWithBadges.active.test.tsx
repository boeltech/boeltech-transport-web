/**
 * El sidebar consume los ítems ya enriquecidos con badge (copias del original),
 * así que el ítem activo tiene que resolverse igual con o sin badge.
 */
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { useNavigationWithBadges } from "./useNavigationWithBadges";

vi.mock("@/shared/permissions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/permissions")>()),
  usePermissions: () => ({
    hasPermission: () => true,
    isLoading: false,
    isAuthenticated: true,
    role: "admin",
  }),
}));

const pendingCount = vi.fn(() => ({ data: 3 }));

vi.mock("@features/approvals", () => ({
  usePendingApprovalsCount: () => pendingCount(),
}));

function renderNavigation(initialEntry: string) {
  return renderHook(() => useNavigationWithBadges(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
    ),
  });
}

function itemById(
  navigation: ReturnType<typeof renderNavigation>["result"]["current"]["navigation"],
  id: string,
) {
  return navigation.flatMap((group) => group.items).find((item) => item.id === id);
}

describe("useNavigationWithBadges", () => {
  it("marks the badged approvals item as active on its hub tab", () => {
    const { result } = renderNavigation("/finance?tab=approvals&status=pending");
    const approvals = itemById(result.current.navigation, "finance-approvals");

    expect(approvals?.badge).toBe(3);
    expect(result.current.isItemActive(approvals!)).toBe(true);
  });

  it("does not mark sibling finance items as active", () => {
    const { result } = renderNavigation("/finance?tab=approvals");
    const hub = itemById(result.current.navigation, "finance-hub");
    const invoiceable = itemById(result.current.navigation, "finance-invoiceable");

    expect(result.current.isItemActive(hub!)).toBe(false);
    expect(result.current.isItemActive(invoiceable!)).toBe(false);
  });

  it("keeps the hub active when no tab is requested", () => {
    const { result } = renderNavigation("/finance");
    const hub = itemById(result.current.navigation, "finance-hub");
    const approvals = itemById(result.current.navigation, "finance-approvals");

    expect(result.current.isItemActive(hub!)).toBe(true);
    expect(result.current.isItemActive(approvals!)).toBe(false);
  });
});
