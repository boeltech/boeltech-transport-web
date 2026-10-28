import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@shared/ui/tooltip";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { platformCopy } from "../copy/platformCopy";
import { PlatformTenantDetailPage } from "./PlatformTenantDetailPage";
import { emptyPlatformTenantHealth } from "../../infrastructure/mappers";

const {
  mockUsePlatformAuth,
  mockUsePlatformTenant,
  mockUsePlatformTenantSubscription,
  mockUsePlatformTenantSaasInvoices,
  mockSetActiveTab,
  mockResendMutate,
} = vi.hoisted(() => ({
  mockUsePlatformAuth: vi.fn(),
  mockUsePlatformTenant: vi.fn(),
  mockUsePlatformTenantSubscription: vi.fn(),
  mockUsePlatformTenantSaasInvoices: vi.fn(),
  mockSetActiveTab: vi.fn(),
  mockResendMutate: vi.fn(),
}));

vi.mock("../providers/PlatformAuthProvider", () => ({
  usePlatformAuth: (...args: unknown[]) => mockUsePlatformAuth(...args),
}));

vi.mock("../../application/hooks/usePlatformTenants", () => ({
  usePlatformTenant: (...args: unknown[]) => mockUsePlatformTenant(...args),
  usePlatformPlans: () => ({ data: [], isLoading: false }),
  useUpdateDeclaredFleet: () => ({ mutate: vi.fn(), isPending: false }),
  useResendPlatformTenantActivation: () => ({
    mutate: mockResendMutate,
    isPending: false,
  }),
}));

vi.mock("../../application/hooks/usePlatformBilling", () => ({
  usePlatformTenantSubscription: (...args: unknown[]) =>
    mockUsePlatformTenantSubscription(...args),
  useUpsertPlatformTenantSubscription: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("../../application/hooks/usePlatformSaasAr", () => ({
  usePlatformTenantSaasInvoices: (...args: unknown[]) =>
    mockUsePlatformTenantSaasInvoices(...args),
}));

vi.mock("../components/TenantThisMonthCard", () => ({
  TenantThisMonthCard: () => <div>ThisMonth</div>,
}));

vi.mock("../components/TenantSaasArCard", () => ({
  TenantSaasArCard: () => <div id="tenant-saas-ar">SaasAr</div>,
}));

vi.mock("../components/TenantSubscriptionCard", () => ({
  TenantSubscriptionCard: () => <div>SubscriptionCard</div>,
}));

vi.mock("../components/TenantAdminActivationCard", () => ({
  TenantAdminActivationCard: () => (
    <div id="tenant-admin-activation">AdminActivation</div>
  ),
}));

vi.mock("../components/TenantActivityTab", () => ({
  TenantActivityTab: () => <div>ActivityTab</div>,
}));

vi.mock("../components/TenantGovernanceControls", () => ({
  TenantGovernanceControls: () => <div>Governance</div>,
}));

vi.mock("../components/ManageSubscriptionSheet", () => ({
  ManageSubscriptionSheet: () => null,
}));

vi.mock("../components/TenantEntitlementsSheet", () => ({
  TenantEntitlementsSheet: () => null,
}));

vi.mock("../components/GrantStampPackSheet", () => ({
  GrantStampPackSheet: () => null,
}));

vi.mock("../components/SuspendTenantDialog", () => ({
  SuspendTenantDialog: () => null,
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...mod,
    useToast: () => ({ toast: vi.fn() }),
    useTabParam: () => ({
      activeTab: "summary",
      setActiveTab: mockSetActiveTab,
    }),
  };
});

const tenant = {
  id: "tenant-1",
  name: "Acme",
  subdomain: "acme",
  status: "active" as const,
  subscriptionStatus: "past_due",
  planCode: "operacion_pequena",
  planName: "Operación Pequeña",
  declaredFleetBand: null,
  declaredFleetUnits: null,
  userCount: 1,
  branchCount: 1,
  tripCount: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  suspendedAt: null,
  healthScore: 40,
  lifecycleStage: "at_risk" as const,
  healthAsOf: null,
  usage: { userCount: 1, branchCount: 1, tripCount: 0 },
  adminActivation: null,
  health: emptyPlatformTenantHealth(),
};

function renderDetail(
  role: "platform_owner" | "platform_support",
  overrides?: {
    tenant?: Partial<typeof tenant>;
    subscriptionStatus?: string;
    invoices?: Array<{ status: string }>;
    isError?: boolean;
    error?: { status: number };
    data?: typeof tenant | undefined;
  },
) {
  mockUsePlatformAuth.mockReturnValue({
    user: {
      id: "u1",
      email: "ops@test.com",
      firstName: "Ops",
      lastName: "Test",
      platformRole: role,
      scope: "platform",
    },
  });
  const resolvedTenant =
    overrides && "data" in overrides
      ? overrides.data
      : { ...tenant, ...overrides?.tenant };
  mockUsePlatformTenant.mockReturnValue({
    data: resolvedTenant,
    isLoading: false,
    isError: overrides?.isError ?? false,
    error: overrides?.error ?? null,
    refetch: vi.fn(),
  });
  mockUsePlatformTenantSubscription.mockReturnValue({
    data: {
      status: overrides?.subscriptionStatus ?? "past_due",
      planName: "Operación Pequeña",
      currentPeriodStart: "2026-08-01T06:00:00.000Z",
      trialEndsAt: null,
      capacity: null,
    },
  });
  mockUsePlatformTenantSaasInvoices.mockReturnValue({
    data: overrides?.invoices ?? [],
  });

  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <MemoryRouter initialEntries={["/platform/tenants/tenant-1"]}>
          <Routes>
            <Route
              path="/platform/tenants/:id"
              element={<PlatformTenantDetailPage />}
            />
          </Routes>
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

describe("PlatformTenantDetailPage Conform (D1–D9)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("past_due: ATF Cobros button switches to commercial (no global AR link)", async () => {
    const user = userEvent.setup();
    renderDetail("platform_owner");

    expect(
      screen.getByText(
        platformCopy.tenants.detail.commercialStrip.pastDueOperating,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", {
        name: platformCopy.tenants.detail.commercialStrip.viewAr,
      }),
    ).not.toBeInTheDocument();

    const cobrosButtons = screen.getAllByRole("button", {
      name: platformCopy.tenants.detail.actions.viewCollections,
    });
    expect(cobrosButtons.length).toBeGreaterThanOrEqual(1);
    await user.click(cobrosButtons[0]!);
    expect(mockSetActiveTab).toHaveBeenCalledWith("commercial");
  });

  it("past_due owner: primary Cobros; Gestionar is secondary outline", () => {
    renderDetail("platform_owner");
    const actions = platformCopy.tenants.detail.actions;

    // Header primary + strip ATF both labeled Cobros
    expect(
      screen.getAllByRole("button", { name: actions.viewCollections }).length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      screen.getByRole("button", { name: actions.manageSubscription }),
    ).toBeInTheDocument();
  });

  it("reader: oculta CTAs de mutación (gestionar / suspender / prepago)", () => {
    renderDetail("platform_support");

    const actions = platformCopy.tenants.detail.actions;
    expect(
      screen.queryByRole("button", { name: actions.manageSubscription }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: actions.moreActions }),
    ).toBeInTheDocument();
    expect(screen.queryByText(actions.suspend)).not.toBeInTheDocument();
    expect(screen.queryByText(actions.grantStampPack)).not.toBeInTheDocument();
    // Strip Cobros is navigation (diagnose), not mutation primary
    expect(
      screen.getByRole("button", {
        name: platformCopy.tenants.detail.commercialStrip.viewAr,
      }),
    ).toBeInTheDocument();
  });

  it("tabs: Resumen · Comercial · Actividad (sin Operación)", () => {
    renderDetail("platform_owner", { subscriptionStatus: "active" });
    const tabs = platformCopy.tenants.detail.tabs;
    expect(screen.getByRole("tab", { name: tabs.summary })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: tabs.commercial }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: tabs.activity }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: "Operación" }),
    ).not.toBeInTheDocument();
  });

  it("suspended: primaria Reactivar", () => {
    renderDetail("platform_owner", {
      tenant: { status: "suspended", subscriptionStatus: "active" },
      subscriptionStatus: "active",
    });
    expect(
      screen.getByRole("button", {
        name: platformCopy.tenants.detail.actions.reactivate,
      }),
    ).toBeInTheDocument();
  });

  it("error recuperable GET: DetailAlertCard + Reintentar (no notFound)", () => {
    renderDetail("platform_owner", {
      data: undefined,
      isError: true,
      error: new ApiError("boom", 500),
    });
    expect(
      screen.getByText(platformCopy.tenants.detail.loadError.title),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: platformCopy.tenants.detail.loadError.retry,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(platformCopy.tenants.detail.notFound.title),
    ).not.toBeInTheDocument();
  });
});
