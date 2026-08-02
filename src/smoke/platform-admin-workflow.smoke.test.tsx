/**
 * Smoke ADR-0062 — consola plataforma tenant 0 (métricas → empresas → suspender).
 * Mock de API; no requiere backend ni Playwright.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type {
  PlatformMetrics,
  PlatformTenantDetail,
  PlatformTenantListItem,
  PlatformUserJSON,
} from "@features/platform/domain/entities";
import { PlatformDashboardPage } from "@features/platform/presentation/pages/PlatformDashboardPage";
import { PlatformTenantsListPage } from "@features/platform/presentation/pages/PlatformTenantsListPage";
import { PlatformTenantDetailPage } from "@features/platform/presentation/pages/PlatformTenantDetailPage";
import { PlatformAuthProvider } from "@features/platform/presentation/providers/PlatformAuthProvider";
import {
  markPlatformFreshLoginSession,
  platformTokenStorage,
} from "@features/platform/infrastructure/platformTokenStorage";
import { platformCopy } from "@features/platform/presentation/copy/platformCopy";

const TENANT_ID = "tenant-smoke-1";

const mockGetMetrics = vi.fn();
const mockListTenants = vi.fn();
const mockGetTenantById = vi.fn();
const mockUpdateTenantStatus = vi.fn();
const mockListPlans = vi.fn();
const mockGetTenantEntitlements = vi.fn();

vi.mock("@features/platform/infrastructure/platformApi", () => ({
  platformApi: {
    login: vi.fn(),
    refresh: vi.fn(),
    getProfile: vi.fn(),
    getMetrics: (...args: unknown[]) => mockGetMetrics(...args),
    listPlans: (...args: unknown[]) => mockListPlans(...args),
    listTenants: (...args: unknown[]) => mockListTenants(...args),
    getTenantById: (...args: unknown[]) => mockGetTenantById(...args),
    createTenant: vi.fn(),
    updateTenantStatus: (...args: unknown[]) => mockUpdateTenantStatus(...args),
    getTenantEntitlements: (...args: unknown[]) =>
      mockGetTenantEntitlements(...args),
  },
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
  };
});

const PLATFORM_USER: PlatformUserJSON = {
  id: "user-platform-smoke",
  email: "platform@boeltech.com",
  firstName: "Platform",
  lastName: "Owner",
  platformRole: "platform_owner",
  scope: "platform",
};

function createActiveTenant(): PlatformTenantDetail {
  return {
    id: TENANT_ID,
    name: "Transporte Demo",
    subdomain: "demo-transporte",
    status: "active",
    planCode: "operacion_esencial",
    planName: "Operación Esencial",
    declaredFleetBand: null,
    declaredFleetUnits: null,
    userCount: 3,
    branchCount: 1,
    tripCount: 12,
    createdAt: "2026-06-01T10:00:00.000Z",
    suspendedAt: null,
    usage: { userCount: 3, branchCount: 1, tripCount: 12 },
  };
}

function createMetrics(): PlatformMetrics {
  return {
    totalTenants: 4,
    activeTenants: 3,
    suspendedTenants: 1,
    tenantsByPlan: {
      operacion_esencial: 2,
      operacion_crecimiento: 1,
    },
    totalUsers: 18,
    tenantsCreatedLast30Days: 1,
  };
}

function seedPlatformSession() {
  localStorage.clear();
  sessionStorage.clear();
  platformTokenStorage.setToken("smoke-platform-token");
  platformTokenStorage.setRefreshToken("smoke-platform-refresh");
  platformTokenStorage.setUser(PLATFORM_USER);
  markPlatformFreshLoginSession();
}

function renderPlatform(
  ui: ReactNode,
  initialEntry = "/platform",
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <PlatformAuthProvider>{ui}</PlatformAuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("smoke platform admin workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedPlatformSession();

    mockListPlans.mockResolvedValue([
      {
        code: "operacion_esencial",
        name: "Operación Esencial",
        maxUsers: 5,
        maxBranches: 2,
        historyMonths: 12,
        isActive: true,
      },
      {
        code: "operacion_crecimiento",
        name: "Operación Crecimiento",
        maxUsers: 15,
        maxBranches: 5,
        historyMonths: 24,
        isActive: true,
      },
    ]);

    mockGetMetrics.mockResolvedValue(createMetrics());

    mockGetTenantEntitlements.mockResolvedValue({
      directEntitlements: [
        {
          moduleCode: "internal_staff_compensation",
          moduleName: "Equipo de apoyo en viajes",
          kind: "addon",
          status: "active",
          activatedAt: "2026-07-01T12:00:00.000Z",
          priceLockedCents: 5900,
          priceTier: "ea",
          memberCodes: [],
        },
      ],
      effectiveModuleCodes: ["internal_staff_compensation"],
      profitabilityLevel: "L0.5",
      catalog: [],
      commercialSummary: {
        planMonthlyPriceCents: 74900,
        modulesTotalCents: 5900,
        overageTotalCents: 0,
        subtotalCents: 80800,
        ivaCents: 12928,
        estimatedTotalCents: 93728,
        currency: "MXN",
        periodKey: "2026-07",
        billingCycle: "monthly",
      },
    });
  });

  it("renders dashboard KPIs from platform metrics", async () => {
    renderPlatform(<PlatformDashboardPage />);

    expect(
      await screen.findByText(platformCopy.dashboard.title),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(mockGetMetrics).toHaveBeenCalled();
    });

    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("Operación Esencial")).toBeInTheDocument();
    expect(screen.getByText("Operación Crecimiento")).toBeInTheDocument();
  });

  it("lists tenants, opens detail, and suspends the tenant", async () => {
    const user = userEvent.setup();
    let tenantState = createActiveTenant();

    mockListTenants.mockImplementation(async () => ({
      data: [tenantState as PlatformTenantListItem],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    }));

    mockGetTenantById.mockImplementation(async () => ({
      data: tenantState,
      message: undefined,
    }));

    mockUpdateTenantStatus.mockImplementation(async (_id, payload) => {
      tenantState = {
        ...tenantState,
        status: payload.status,
        suspendedAt:
          payload.status === "suspended"
            ? "2026-07-04T16:00:00.000Z"
            : null,
      };
      return {
        data: tenantState as PlatformTenantListItem,
        message: "Estado actualizado",
      };
    });

    renderPlatform(
      <Routes>
        <Route path="/platform/tenants" element={<PlatformTenantsListPage />} />
        <Route
          path="/platform/tenants/:id"
          element={<PlatformTenantDetailPage />}
        />
      </Routes>,
      "/platform/tenants",
    );

    const tenantNameMatches = await screen.findAllByText("Transporte Demo");
    expect(tenantNameMatches.length).toBeGreaterThan(0);
    expect(screen.getAllByText("demo-transporte").length).toBeGreaterThan(0);

    await user.click(tenantNameMatches[0]);

    expect(
      await screen.findByRole("heading", { name: "Transporte Demo" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(platformCopy.tenants.commercial.title),
    ).toBeInTheDocument();
    expect(screen.getByText("Equipo de apoyo en viajes")).toBeInTheDocument();
    expect(screen.getAllByText(/\$937/).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", {
        name: platformCopy.tenants.detail.actions.suspend,
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: platformCopy.tenants.detail.actions.suspend,
      }),
    );

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText(platformCopy.tenants.suspend.suspendTitle),
    ).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("button", {
        name: platformCopy.tenants.suspend.confirmSuspend,
      }),
    );

    await waitFor(() => {
      expect(mockUpdateTenantStatus).toHaveBeenCalledWith(TENANT_ID, {
        status: "suspended",
        reason: "",
      });
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: platformCopy.tenants.detail.actions.reactivate,
        }),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("button", {
        name: platformCopy.tenants.detail.actions.suspend,
      }),
    ).not.toBeInTheDocument();
  });
});
