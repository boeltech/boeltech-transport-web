import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { OpsTenantsListPage } from "./OpsTenantsListPage";
import { opsCopy } from "./opsCopy";

const { mockUsePlatformTenants, mockUsePlatformAuth } = vi.hoisted(() => ({
  mockUsePlatformTenants: vi.fn(),
  mockUsePlatformAuth: vi.fn(),
}));

vi.mock("../../application/hooks/usePlatformTenants", () => ({
  usePlatformTenants: (...args: unknown[]) => mockUsePlatformTenants(...args),
  usePlatformPlans: () => ({ data: [] }),
}));

vi.mock("../providers/PlatformAuthProvider", () => ({
  usePlatformAuth: (...args: unknown[]) => mockUsePlatformAuth(...args),
}));

const baseTenant = {
  id: "t1",
  name: "Transportes Norte",
  subdomain: "norte",
  status: "active",
  planCode: "operacion_crecimiento",
  planName: "Crecimiento",
  healthScore: 80,
  lifecycleStage: "active",
  subscriptionStatus: "active",
  createdAt: "2026-10-01T18:00:00.000Z",
  suspendedAt: null,
};

describe("OpsTenantsListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePlatformAuth.mockReturnValue({
      user: {
        id: "u1",
        platformRole: "platform_owner",
        scope: "platform",
        email: "o@t.com",
      },
    });
    mockUsePlatformTenants.mockReturnValue({
      data: {
        data: [baseTenant],
        pagination: { page: 1, totalPages: 1, total: 1, limit: 20 },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it("renders OpsTable with column headers and tenant cells", () => {
    renderWithTheme(<OpsTenantsListPage />, {
      route: ["/platform/tenants"],
    });

    expect(screen.getByTestId("platform-ops-tenants")).toBeInTheDocument();
    const table = screen.getByTestId("ops-table");
    expect(table).toBeInTheDocument();
    expect(screen.queryByTestId("ops-tenant-row")).not.toBeInTheDocument();

    const cols = opsCopy.tenants.columns;
    expect(screen.getByRole("columnheader", { name: cols.name })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: cols.plan })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: cols.stage })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: cols.date })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: cols.action })).toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: cols.health }),
    ).not.toBeInTheDocument();

    expect(within(table).getByText("norte")).toBeInTheDocument();
    expect(
      within(table).getByRole("link", { name: "Transportes Norte" }),
    ).toHaveAttribute("href", "/platform/tenants/t1");
    expect(within(table).getByText("Crecimiento")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: opsCopy.tenants.create }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: opsCopy.tenants.viewAr }),
    ).not.toBeInTheDocument();
  });

  it("shows Cobros action when subscription is past_due", () => {
    mockUsePlatformTenants.mockReturnValue({
      data: {
        data: [{ ...baseTenant, subscriptionStatus: "past_due" }],
        pagination: { page: 1, totalPages: 1, total: 1, limit: 20 },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithTheme(<OpsTenantsListPage />, {
      route: ["/platform/tenants"],
    });

    const cobros = screen.getByRole("link", { name: opsCopy.tenants.viewAr });
    expect(cobros).toHaveAttribute(
      "href",
      "/platform/billing/ar?status=open&tenant_id=t1",
    );
  });

  it("applies warn/danger tick on the table row", () => {
    mockUsePlatformTenants.mockReturnValue({
      data: {
        data: [
          {
            ...baseTenant,
            status: "suspended",
            lifecycleStage: "suspended",
            subscriptionStatus: "unpaid",
          },
        ],
        pagination: { page: 1, totalPages: 1, total: 1, limit: 20 },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithTheme(<OpsTenantsListPage />, {
      route: ["/platform/tenants"],
    });

    const row = screen.getByTestId("ops-table").querySelector("tbody tr");
    expect(row).toHaveAttribute("data-ops-tick", "danger");
  });

  it("hides create for platform_support", () => {
    mockUsePlatformAuth.mockReturnValue({
      user: {
        id: "u2",
        platformRole: "platform_support",
        scope: "platform",
        email: "s@t.com",
      },
    });

    renderWithTheme(<OpsTenantsListPage />, {
      route: ["/platform/tenants"],
    });

    expect(
      screen.queryByRole("button", { name: opsCopy.tenants.create }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(opsCopy.tenants.readOnly)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: opsCopy.tenants.viewAr }),
    ).not.toBeInTheDocument();
  });
});
