/**
 * Smoke T4 — Inicio (/dashboard) F3 por rol:
 * zonas fijas, Cobrado esta semana (contador), sin K10 (despachador),
 * Personalizar no oculta zonas fijas.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { UserRole } from "@shared/constants/roles";
import { checkPermission, getPermissionsForRole } from "@shared/permissions/domain";
import DashboardPage from "@features/dashboard/presentation/DashboardPage";
import { dashboardCopy } from "@features/dashboard/presentation/copy/dashboardCopy";
import { grantPermissions } from "@/test/mocks/permissions";

const FINANCE_ROLES = new Set<UserRole>(["admin", "manager", "accountant"]);

const { mockUseAuth, mockLayoutApi } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockLayoutApi: vi.fn(),
}));

vi.mock("@features/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@shared/permissions", async () =>
  (await import("@/test/mocks/permissions")).permissionsModuleMock(),
);

vi.mock("@features/dashboard/application/hooks/useDashboard", () => ({
  useDashboard: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    isFetching: false,
  }),
}));

vi.mock("@features/dashboard/application/hooks/useDashboardActivation", () => ({
  useDashboardActivation: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("@features/dashboard/application/hooks/useDashboardAttention", () => ({
  useDashboardAttention: () => ({
    rows: [],
    isLoading: false,
    snapshot: {
      pendingCount: 0,
      firstPending: null,
      topDetail: null,
      isLoading: false,
      fiscalReady: false,
      opsDay: { tripsToday: 0, inProgress: 0 },
    },
  }),
}));

vi.mock("@features/trips/application", () => ({
  useTripOpsDaySummary: () => ({
    data: {
      counts: { departing: 1, inProgress: 0, overdue: 0, arrived: 0 },
      overdueBreakdown: { departureLate: 0, arrivalLate: 0 },
      items: [],
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    isFetching: false,
  }),
}));

vi.mock("@features/dashboard/application/hooks/useFleetAvailability", () => ({
  useFleetAvailability: () => ({
    data: {
      vehicles: {
        totalActive: 4,
        free: 2,
        onTrip: 1,
        inMaintenance: 1,
        outOfService: 0,
      },
      drivers: { totalActive: 3, free: 1, onTrip: 1, resting: 1 },
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    isFetching: false,
  }),
}));

vi.mock("@features/finance", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/finance")>();
  return {
    ...actual,
    getCurrentMonthExpenseRange: () => ({ from: "2026-11-01", to: "2026-11-30" }),
    useExpensesByDimension: () => ({ data: undefined, isLoading: false }),
    useFinanceSummary: () => ({
      data: {
        totalReceivable: 0,
        collectedThisMonth: 0,
        totalOverdue: 0,
        expensesThisMonth: 0,
        invoicesByStatus: {
          draft: 0,
          stamped: 0,
          cancellationPending: 0,
          cancelled: 0,
        },
      },
      isLoading: false,
    }),
    useCollectionsWeek: () => ({
      data: {
        weekStart: "2026-11-16",
        weekEnd: "2026-11-22",
        days: [
          {
            date: "2026-11-16",
            withInvoice: 1000,
            withoutInvoice: 500,
            total: 1500,
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isFetching: false,
    }),
    useOpenPpdSummary: () => ({ data: undefined, isLoading: false }),
  };
});

vi.mock("@features/dashboard/application/hooks/useTripsByDay", () => ({
  useTripsByDay: () => ({ data: undefined, isLoading: false }),
}));

vi.mock("@features/dashboard/application/hooks/useFinancialTrend", () => ({
  useFinancialTrend: () => ({ data: undefined, isLoading: false }),
}));

vi.mock("@features/dashboard/application/hooks/useDashboardLayout", () => ({
  useDashboardLayout: () => mockLayoutApi(),
}));

vi.mock("@features/approvals/application", () => ({
  useApprovalsPendingCountsByType: () => ({ data: undefined, isLoading: false }),
}));

function grantRole(role: UserRole) {
  const permissions = getPermissionsForRole(role);
  grantPermissions(
    (module, action) => checkPermission(role, permissions, module, action).allowed,
    { role },
  );
}

function baseLayoutApi(role: UserRole) {
  const showFinance = FINANCE_ROLES.has(role);
  const labels: string[] = [dashboardCopy.customize.fixedZones.attention];
  if (role !== "accountant" && role !== "client" && role !== "driver") {
    labels.push(
      dashboardCopy.customize.fixedZones.opsDay,
      dashboardCopy.customize.fixedZones.fleetAvailability,
    );
  }
  if (showFinance) {
    labels.push(dashboardCopy.customize.fixedZones.scorecard);
  }
  if (role === "accountant" && showFinance) {
    labels.push(dashboardCopy.customize.fixedZones.collectionsWeek);
  }
  return {
    visibleWidgets: [],
    customizableWidgets: [
      {
        id: "financial_comparison",
        visible: false,
        order: 0,
      },
      { id: "trips_by_day", visible: false, order: 1 },
    ],
    fixedZoneLabels: labels,
    getSpanClass: () => "lg:col-span-12",
    canReadTrips: role !== "client",
    showFinance,
    setVisible: vi.fn(),
    reorder: vi.fn(),
    applyLayoutDraft: vi.fn(),
    resetToRoleDefault: vi.fn(),
    resetToSystemDefault: vi.fn(),
  };
}

function renderDashboard(role: UserRole) {
  grantRole(role);
  mockUseAuth.mockReturnValue({
    user: {
      id: "u1",
      role,
      firstName: "Ana",
      tenant: { id: "t1" },
    },
    isAuthenticated: true,
  });
  mockLayoutApi.mockReturnValue(baseLayoutApi(role));

  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/dashboard"]}>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("smoke dashboard-inicio F3", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("admin/manager: Lo que te toca + Viajes + Disponibles + K10; sin Cobrado semana", () => {
    for (const role of ["admin", "manager"] as const) {
      const { unmount } = renderDashboard(role);
      expect(
        screen.getByRole("heading", { name: dashboardCopy.attention.title }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: dashboardCopy.opsDay.title }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", {
          name: dashboardCopy.fleetAvailability.title,
        }),
      ).toBeInTheDocument();
      // Scorecard section is named by aria-labelledby → title «Resumen del mes».
      expect(
        screen.getByRole("region", {
          name: dashboardCopy.scorecard.title,
        }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", {
          name: dashboardCopy.collectionsWeek.title,
        }),
      ).not.toBeInTheDocument();
      unmount();
    }
  });

  it("dispatcher/operator: Viajes + Disponibles; sin K10 ni Cobrado semana", () => {
    for (const role of ["dispatcher", "operator"] as const) {
      const { unmount } = renderDashboard(role);
      expect(
        screen.getByRole("heading", { name: dashboardCopy.opsDay.title }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", {
          name: dashboardCopy.fleetAvailability.title,
        }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("region", {
          name: dashboardCopy.scorecard.title,
        }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("heading", {
          name: dashboardCopy.collectionsWeek.title,
        }),
      ).not.toBeInTheDocument();
      unmount();
    }
  });

  it("accountant: Cobrado esta semana + K10; sin Viajes de hoy ni Disponibles", () => {
    renderDashboard("accountant");
    expect(
      screen.getByRole("heading", { name: dashboardCopy.attention.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", {
        name: dashboardCopy.scorecard.title,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: dashboardCopy.collectionsWeek.title,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: dashboardCopy.opsDay.title }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: dashboardCopy.fleetAvailability.title,
      }),
    ).not.toBeInTheDocument();
  });

  it("Personalizar lista zonas fijas sin toggles; extras en Agregar abajo", async () => {
    const user = userEvent.setup();
    renderDashboard("manager");
    await user.click(
      screen.getByRole("button", {
        name: new RegExp(dashboardCopy.customize.personalizeButton),
      }),
    );
    const sheet = await screen.findByRole("dialog");
    expect(
      within(sheet).getByText(dashboardCopy.customize.alwaysVisible),
    ).toBeInTheDocument();
    expect(
      within(sheet).getByText(dashboardCopy.customize.fixedZones.attention),
    ).toBeInTheDocument();
    expect(
      within(sheet).getByText(dashboardCopy.customize.fixedZones.opsDay),
    ).toBeInTheDocument();
    expect(
      within(sheet).queryByRole("switch", {
        name: dashboardCopy.customize.fixedZones.attention,
      }),
    ).not.toBeInTheDocument();
    expect(
      within(sheet).getByText(dashboardCopy.customize.addBelow),
    ).toBeInTheDocument();
    expect(
      within(sheet).getByText("Ingresos, costos y margen"),
    ).toBeInTheDocument();
  });
});
