import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { dashboardCopy } from "./copy/dashboardCopy";
import { DASHBOARD_ORIENTATION_STORAGE_KEY_PREFIX } from "./components/DashboardOrientationAlert";
import DashboardPage from "./DashboardPage";
import { formatDashboardTodayLabel } from "./utils/dashboardChartHelpers";

type WidgetPrefStub = { id: string; visible: boolean; order: number };

const { mockUseAuth, mockCanReadTrips, mockLayoutWidgets } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockCanReadTrips: vi.fn(() => true),
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
      hasPermission: () => false,
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
    getSpanClass: () => "",
    canReadTrips: mockCanReadTrips(),
    showFinance: false,
    setVisible: vi.fn(),
    reorder: vi.fn(),
    resetToRoleDefault: vi.fn(),
    resetToSystemDefault: vi.fn(),
  }),
}));

vi.mock("@features/finance", () => ({
  getCurrentMonthExpenseRange: () => ({ from: "2026-09-01", to: "2026-09-30" }),
  useExpensesByDimension: () => ({ data: undefined, isLoading: false }),
  useFinanceSummary: () => ({ data: undefined, isLoading: false }),
}));

function renderDashboard(role: string) {
  mockUseAuth.mockReturnValue({ user: { role } });
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

function clearOrientationStorage() {
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (key?.startsWith(DASHBOARD_ORIENTATION_STORAGE_KEY_PREFIX)) {
      keys.push(key);
    }
  }
  keys.forEach((key) => window.localStorage.removeItem(key));
}

describe("DashboardPage — orientación client", () => {
  beforeEach(() => {
    mockCanReadTrips.mockReturnValue(true);
    clearOrientationStorage();
  });

  it("muestra dos puentes y no Personalizar", () => {
    renderDashboard("client");

    expect(
      screen.getByText(dashboardCopy.page.subtitleClient),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: dashboardCopy.page.tripsBridgeClientLink,
      }),
    ).toHaveAttribute("href", "/trips");
    expect(
      screen.getByRole("link", {
        name: dashboardCopy.page.invoicesBridgeClientLink,
      }),
    ).toHaveAttribute("href", "/finance/invoices");
    expect(
      screen.queryByRole("button", {
        name: dashboardCopy.customize.personalizeButton,
      }),
    ).not.toBeInTheDocument();
  });

  it("admin muestra dos puentes de setup y no el de Viajes", () => {
    renderDashboard("admin");

    expect(
      screen.getByText(dashboardCopy.page.subtitleAdmin),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: dashboardCopy.page.usersBridgeLink }),
    ).toHaveAttribute("href", "/users");
    expect(
      screen.getByRole("link", { name: dashboardCopy.page.billingBridgeLink }),
    ).toHaveAttribute("href", "/settings/billing");
    expect(
      screen.queryByRole("link", { name: dashboardCopy.page.tripsBridgeLink }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(dashboardCopy.page.tripsBridge),
    ).not.toBeInTheDocument();
  });

  it.each([
    [
      "accountant",
      dashboardCopy.page.invoiceableBridgeLink,
      "/finance/invoiceable",
    ],
    [
      "manager",
      dashboardCopy.page.fiscalAttentionBridgeLink,
      "/trips?fiscalAttention=1",
    ],
    ["operator", dashboardCopy.page.tripsBridgeOperatorLink, "/trips"],
    ["dispatcher", dashboardCopy.page.tripsBridgeLink, "/trips"],
  ] as const)("%s muestra su puente", (role, linkName, href) => {
    renderDashboard(role);
    // Job CTA del toolbar (D1) puede repetir el mismo label que el puente de orientación.
    const links = screen.getAllByRole("link", { name: linkName });
    expect(links.some((el) => el.getAttribute("href") === href)).toBe(true);
  });

  it("driver conserva un solo puente a Mis viajes", () => {
    renderDashboard("driver");

    expect(
      screen.getByRole("link", {
        name: dashboardCopy.page.tripsBridgeDriverLink,
      }),
    ).toHaveAttribute("href", "/trips");
    expect(
      screen.queryByRole("link", {
        name: dashboardCopy.page.invoicesBridgeClientLink,
      }),
    ).not.toBeInTheDocument();
  });

  it("tras Entendido desaparecen los puentes y queda el saludo", async () => {
    const user = userEvent.setup();
    renderDashboard("admin");

    expect(
      screen.getByRole("link", { name: dashboardCopy.page.usersBridgeLink }),
    ).toBeInTheDocument();
    const greeting = screen.getByRole("heading", { level: 1 });
    expect(greeting).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: dashboardCopy.page.orientationDismiss,
      }),
    );

    expect(
      screen.queryByRole("link", { name: dashboardCopy.page.usersBridgeLink }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", {
        name: dashboardCopy.page.billingBridgeLink,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(dashboardCopy.page.subtitleAdmin),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      greeting.textContent ?? "",
    );
    expect(
      screen.getByText(formatDashboardTodayLabel()),
    ).toBeInTheDocument();
  });

  it("muestra la fecha del día bajo el saludo", () => {
    renderDashboard("dispatcher");
    expect(
      screen.getByText(formatDashboardTodayLabel()),
    ).toBeInTheDocument();
  });

  it("dispatcher expone CTA primario Ir a Viajes y Personalizar terciario", () => {
    mockLayoutWidgets.mockReturnValue({
      customizable: [{ id: "stub_a", visible: true, order: 0 }],
      visible: [{ id: "stub_a", visible: true, order: 0 }],
    });
    renderDashboard("dispatcher");
    const tripLinks = screen.getAllByRole("link", {
      name: dashboardCopy.page.jobActions.trips,
    });
    expect(tripLinks.some((el) => el.getAttribute("href") === "/trips")).toBe(
      true,
    );
    expect(
      screen.getByRole("button", {
        name: dashboardCopy.customize.personalizeButton,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: dashboardCopy.page.refresh }),
    ).toBeInTheDocument();
  });
});

describe("DashboardPage — contador de widgets ocultos", () => {
  beforeEach(() => {
    mockCanReadTrips.mockReturnValue(true);
    clearOrientationStorage();
  });

  it("muestra cuántos widgets permitidos están ocultos en Personalizar", () => {
    // Widgets fuera del registry: el grid los omite y aísla el test del render de widgets.
    mockLayoutWidgets.mockReturnValue({
      customizable: [
        { id: "stub_a", visible: true, order: 0 },
        { id: "stub_b", visible: false, order: 1 },
        { id: "stub_c", visible: false, order: 2 },
        { id: "stub_d", visible: false, order: 3 },
      ],
      visible: [{ id: "stub_a", visible: true, order: 0 }],
    });
    renderDashboard("dispatcher");

    expect(
      screen.getByRole("button", {
        name: `${dashboardCopy.customize.personalizeButton} · ${dashboardCopy.customize.hiddenWidgetsCount(3)}`,
      }),
    ).toBeInTheDocument();
  });

  it("sin widgets ocultos no muestra contador", () => {
    mockLayoutWidgets.mockReturnValue({
      customizable: [{ id: "stub_a", visible: true, order: 0 }],
      visible: [{ id: "stub_a", visible: true, order: 0 }],
    });
    renderDashboard("dispatcher");

    expect(
      screen.getByRole("button", {
        name: dashboardCopy.customize.personalizeButton,
      }),
    ).toBeInTheDocument();
  });
});
