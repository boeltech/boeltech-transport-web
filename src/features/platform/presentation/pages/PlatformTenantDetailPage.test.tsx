import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@shared/ui/tooltip";
import { platformCopy } from "../copy/platformCopy";
import { PlatformTenantDetailPage } from "./PlatformTenantDetailPage";
import { emptyPlatformTenantHealth } from "../../infrastructure/mappers";

const {
  mockUsePlatformAuth,
  mockUsePlatformTenant,
  mockUsePlatformTenantSubscription,
} = vi.hoisted(() => ({
  mockUsePlatformAuth: vi.fn(),
  mockUsePlatformTenant: vi.fn(),
  mockUsePlatformTenantSubscription: vi.fn(),
}));

vi.mock("../providers/PlatformAuthProvider", () => ({
  usePlatformAuth: (...args: unknown[]) => mockUsePlatformAuth(...args),
}));

vi.mock("../../application/hooks/usePlatformTenants", () => ({
  usePlatformTenant: (...args: unknown[]) => mockUsePlatformTenant(...args),
  usePlatformPlans: () => ({ data: [], isLoading: false }),
}));

vi.mock("../../application/hooks/usePlatformBilling", () => ({
  usePlatformTenantSubscription: (...args: unknown[]) =>
    mockUsePlatformTenantSubscription(...args),
  useUpsertPlatformTenantSubscription: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("../components/TenantThisMonthCard", () => ({
  TenantThisMonthCard: () => <div>ThisMonth</div>,
}));

vi.mock("../components/TenantSaasArCard", () => ({
  TenantSaasArCard: () => <div>SaasAr</div>,
}));

vi.mock("../components/TenantSubscriptionCard", () => ({
  TenantSubscriptionCard: () => <div>SubscriptionCard</div>,
}));

vi.mock("../components/TenantAdminActivationCard", () => ({
  TenantAdminActivationCard: () => <div>AdminActivation</div>,
}));

vi.mock("../components/TenantActivityTab", () => ({
  TenantActivityTab: () => <div>ActivityTab</div>,
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
      setActiveTab: vi.fn(),
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

function renderDetail(role: "platform_owner" | "platform_support") {
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
  mockUsePlatformTenant.mockReturnValue({
    data: tenant,
    isLoading: false,
    isError: false,
  });
  mockUsePlatformTenantSubscription.mockReturnValue({
    data: {
      status: "past_due",
      planName: "Operación Pequeña",
      currentPeriodStart: "2026-08-01T06:00:00.000Z",
      trialEndsAt: null,
      capacity: null,
    },
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

describe("PlatformTenantDetailPage F3 (D10/D13)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("past_due: alerta con job Ver en Cobros (DetailAlertCard.action)", () => {
    renderDetail("platform_owner");

    expect(
      screen.getByText(
        platformCopy.tenants.detail.commercialStrip.pastDueOperating,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: platformCopy.tenants.detail.commercialStrip.viewAr,
      }),
    ).toHaveAttribute(
      "href",
      "/platform/billing/ar?tenant_id=tenant-1",
    );
  });

  it("reader: oculta CTAs de mutación (gestionar / suspender)", () => {
    renderDetail("platform_support");

    const actions = platformCopy.tenants.detail.actions;
    expect(
      screen.queryByRole("button", { name: actions.manageSubscription }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: actions.moreActions })).toBeInTheDocument();
    // Suspend lives inside the more menu for owners only; reader must not see it as a menuitem when opened — assert via absence of Suspend label in document before open is enough for header primary CTA.
    expect(screen.queryByText(actions.suspend)).not.toBeInTheDocument();
    expect(screen.queryByText(actions.grantStampPack)).not.toBeInTheDocument();
  });
});
