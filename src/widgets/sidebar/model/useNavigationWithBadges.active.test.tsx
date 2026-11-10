/**
 * El sidebar consume los ítems ya enriquecidos con badge (copias del original),
 * así que el ítem activo tiene que resolverse igual con o sin badge.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
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
  beforeEach(() => {
    pendingCount.mockReturnValue({ data: 3 });
  });

  it("exposes grupo Pagos a operadores con 4 destinos (F2)", () => {
    const { result } = renderNavigation("/finance/operator-payments");
    const pagos = itemById(result.current.navigation, "operator-payments-pagos");
    const advances = itemById(
      result.current.navigation,
      "operator-payments-advances",
    );
    const agreements = itemById(result.current.navigation, "finance-agreements");

    expect(pagos?.label).toBe("Pagos");
    expect(advances?.label).toBe("Anticipos");
    expect(agreements).toBeUndefined();
    expect(result.current.isItemActive(pagos!)).toBe(true);
    expect(result.current.isItemActive(advances!)).toBe(false);
  });
  it("marks the badged approvals item as active on its route", () => {
    const { result } = renderNavigation("/finance/approvals?status=pending");
    const approvals = itemById(result.current.navigation, "finance-approvals");

    expect(approvals?.badge).toBe(3);
    expect(result.current.isItemActive(approvals!)).toBe(true);
  });

  it("does not mark sibling finance items as active", () => {
    const { result } = renderNavigation("/finance/approvals");
    const hub = itemById(result.current.navigation, "finance-hub");
    const invoiceable = itemById(result.current.navigation, "finance-invoiceable");
    const cobros = itemById(result.current.navigation, "finance-cobros");

    expect(result.current.isItemActive(hub!)).toBe(false);
    expect(result.current.isItemActive(invoiceable!)).toBe(false);
    expect(result.current.isItemActive(cobros!)).toBe(false);
  });

  it("marks cobros as the active finance job when that route is open", () => {
    const { result } = renderNavigation("/finance/payments?rfc=XAXX010101000");
    const cobros = itemById(result.current.navigation, "finance-cobros");
    const hub = itemById(result.current.navigation, "finance-hub");

    expect(result.current.isItemActive(cobros!)).toBe(true);
    expect(result.current.isItemActive(hub!)).toBe(false);
  });

  it("keeps the hub active on /finance", () => {
    const { result } = renderNavigation("/finance");
    const hub = itemById(result.current.navigation, "finance-hub");
    const approvals = itemById(result.current.navigation, "finance-approvals");

    expect(result.current.isItemActive(hub!)).toBe(true);
    expect(result.current.isItemActive(approvals!)).toBe(false);
  });
});
