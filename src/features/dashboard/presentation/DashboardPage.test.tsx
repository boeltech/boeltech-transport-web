import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { DASHBOARD_PATH } from "@shared/utils/reportsWayfinding";
import { dashboardCopy } from "./copy/dashboardCopy";
import DashboardPage from "./DashboardPage";
import { formatAttentionEyebrow } from "../domain/attentionQueue";

type WidgetPrefStub = { id: string; visible: boolean; order: number };

const { mockUseAuth, mockCanReadTrips, mockLayoutWidgets, mockHasPermission } =
  vi.hoisted(() => ({
    mockUseAuth: vi.fn(),
    mockCanReadTrips: vi.fn(() => true),
    mockHasPermission: vi.fn(() => false),
    mockLayoutWidgets: vi.fn(
      (): { customizable: WidgetPrefStub[]; visible: WidgetPrefStub[] } => ({
        customizable: [],
        visible: [],
      }),
    ),
  }));

vi.mock("@/features/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("../application/hooks/useDashboard", () => ({
  useDashboard: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    isFetching: false,
  }),
}));

vi.mock("../application/hooks/useDashboardActivation", () => ({
  useDashboardActivation: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("../application/hooks/useDashboardAttention", () => ({
  useDashboardAttention: () => ({
    rows: [],
    isLoading: false,
    snapshot: {
      pendingCount: 0,
      firstPending: null,
      topDetail: null,
      isLoading: false,
    },
  }),
}));

vi.mock("@features/trips/application", () => ({
  useTripOpsDaySummary: () => ({
    data: {
      counts: { departing: 0, inProgress: 0, overdue: 0, arrived: 0 },
      overdueBreakdown: { departureLate: 0, arrivalLate: 0 },
      items: [],
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    isFetching: false,
  }),
}));

vi.mock("../application/hooks/useFleetAvailability", () => ({
  useFleetAvailability: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    isFetching: false,
  }),
}));

vi.mock("@features/approvals/application", () => ({
  useApprovalsPendingCountsByType: () => ({
    data: undefined,
    isLoading: false,
  }),
}));

vi.mock("@shared/permissions", async () => {
  const actual = await vi.importActual<typeof import("@shared/permissions")>(
    "@shared/permissions",
  );
  return {
    ...actual,
    usePermissions: () => ({
      hasPermission: mockHasPermission,
      can: () => false,
      permissions: {},
    }),
  };
});

vi.mock("../application/hooks/useTripsByDay", () => ({
  useTripsByDay: () => ({ data: undefined, isLoading: false }),
}));

vi.mock("../application/hooks/useFinancialTrend", () => ({
  useFinancialTrend: () => ({ data: undefined, isLoading: false }),
}));

vi.mock("../application/hooks/useDashboardLayout", () => ({
  useDashboardLayout: () => ({
    visibleWidgets: mockLayoutWidgets().visible,
    customizableWidgets: mockLayoutWidgets().customizable,
    fixedZoneLabels: ["Lo que te toca"],
    getSpanClass: () => "",
    canReadTrips: mockCanReadTrips(),
    showFinance: false,
    setVisible: vi.fn(),
    reorder: vi.fn(),
    applyLayoutDraft: vi.fn(),
    resetToRoleDefault: vi.fn(),
    resetToSystemDefault: vi.fn(),
  }),
}));

vi.mock("@features/finance", () => ({
  getCurrentMonthExpenseRange: () => ({ from: "2026-09-01", to: "2026-09-30" }),
  useExpensesByDimension: () => ({ data: undefined, isLoading: false }),
  useFinanceSummary: () => ({ data: undefined, isLoading: false }),
  FINANCE_COBROS_PATH: "/finance/payments",
  FINANCE_HUB_PATH: "/finance",
  FINANCE_INVOICEABLE_PATH: "/finance/invoiceable",
  useOpenPpdSummary: () => ({ data: undefined, isLoading: false }),
}));

function renderDashboard(role: string, firstName = "Rodrigo") {
  mockUseAuth.mockReturnValue({
    user: { role, firstName },
  });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("DashboardPage — F1 encabezado I12", () => {
  beforeEach(() => {
    mockCanReadTrips.mockReturnValue(true);
    mockHasPermission.mockReturnValue(false);
    mockLayoutWidgets.mockReturnValue({ customizable: [], visible: [] });
  });

  it("saludo es h1 para admin; sin titleShort Inicio", () => {
    renderDashboard("admin");
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toMatch(/Buen[oa]s/);
    expect(h1).toHaveTextContent("Rodrigo");
    expect(h1).not.toHaveTextContent(dashboardCopy.page.titleShort);
  });

  it("eyebrow con Todas las sucursales", () => {
    renderDashboard("manager");
    expect(screen.getByText(formatAttentionEyebrow())).toBeInTheDocument();
  });

  it("dispatcher CTA Nuevo viaje cuando puede crear", () => {
    mockHasPermission.mockImplementation(
      (mod: string, action: string) =>
        mod === "trips" && action === "create",
    );
    mockLayoutWidgets.mockReturnValue({
      customizable: [{ id: "stub_a", visible: true, order: 0 }],
      visible: [{ id: "stub_a", visible: true, order: 0 }],
    });
    renderDashboard("dispatcher");
    expect(
      screen.getByRole("link", { name: dashboardCopy.page.jobActions.newTrip }),
    ).toHaveAttribute("href", "/trips/new");
    expect(
      screen.getByRole("button", {
        name: dashboardCopy.customize.personalizeButton,
      }),
    ).toBeInTheDocument();
  });

  it("job CTA pasa state.from y fromLabel (H-U01-N02)", async () => {
    const user = userEvent.setup();
    mockHasPermission.mockImplementation(
      (mod: string, action: string) =>
        mod === "trips" && action === "create",
    );
    mockLayoutWidgets.mockReturnValue({
      customizable: [{ id: "stub_a", visible: true, order: 0 }],
      visible: [{ id: "stub_a", visible: true, order: 0 }],
    });
    mockUseAuth.mockReturnValue({
      user: { role: "dispatcher", firstName: "Rodrigo" },
    });

    function DestinationProbe() {
      const location = useLocation();
      return (
        <pre data-testid="dest-state">{JSON.stringify(location.state)}</pre>
      );
    }

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[DASHBOARD_PATH]}>
          <Routes>
            <Route path={DASHBOARD_PATH} element={<DashboardPage />} />
            <Route path="/trips/new" element={<DestinationProbe />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(
      screen.getByRole("link", { name: dashboardCopy.page.jobActions.newTrip }),
    );

    expect(screen.getByTestId("dest-state")).toHaveTextContent(
      '"from":"/dashboard"',
    );
    expect(screen.getByTestId("dest-state")).toHaveTextContent(
      '"fromLabel":"Inicio"',
    );
  });

  it("accountant CTA Ir a Por facturar", () => {
    renderDashboard("accountant");
    expect(
      screen.getByRole("link", {
        name: dashboardCopy.page.jobActions.invoiceable,
      }),
    ).toHaveAttribute("href", "/finance/invoiceable");
  });

  it("muestra zona Lo que te toca", () => {
    renderDashboard("admin");
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: dashboardCopy.attention.title,
      }),
    ).toBeInTheDocument();
  });

  it("sin OrientationAlert ATF", () => {
    renderDashboard("admin");
    expect(
      screen.queryByRole("button", {
        name: dashboardCopy.page.orientationDismiss,
      }),
    ).not.toBeInTheDocument();
  });

  it("gerente ve Viajes de hoy y Disponibles ahora", () => {
    renderDashboard("manager");
    expect(
      screen.getByRole("heading", { name: dashboardCopy.opsDay.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: dashboardCopy.fleetAvailability.title,
      }),
    ).toBeInTheDocument();
  });

  it("contador no ve Viajes de hoy ni Disponibles ahora", () => {
    mockCanReadTrips.mockReturnValue(true);
    renderDashboard("accountant");
    expect(
      screen.queryByRole("heading", { name: dashboardCopy.opsDay.title }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: dashboardCopy.fleetAvailability.title,
      }),
    ).not.toBeInTheDocument();
  });
});
