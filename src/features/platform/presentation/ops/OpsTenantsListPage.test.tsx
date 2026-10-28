import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
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
        data: [
          {
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
          },
        ],
        pagination: { page: 1, totalPages: 1, total: 1, limit: 20 },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it("renders a tenant row without the badge table", () => {
    renderWithTheme(<OpsTenantsListPage />, {
      route: ["/platform/tenants"],
    });

    expect(screen.getByTestId("platform-ops-tenants")).toBeInTheDocument();
    expect(screen.queryByTestId("ops-table")).not.toBeInTheDocument();
    const row = screen.getByTestId("ops-tenant-row");
    expect(row).toHaveTextContent("norte");
    expect(row).toHaveTextContent("Transportes Norte");
    expect(row).toHaveTextContent("Crecimiento");
    expect(row.querySelector("button")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: opsCopy.tenants.create }),
    ).toBeInTheDocument();
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
    expect(screen.getByTestId("ops-tenant-row").querySelector("button")).toBeNull();
  });
});
