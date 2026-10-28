import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TenantGovernanceControls } from "./TenantGovernanceControls";
import { platformCopy } from "../copy/platformCopy";
import { platformApi } from "../../infrastructure/platformApi";
import { emptyPlatformTenantHealth } from "../../infrastructure/mappers";
import type {
  PlatformTenantDetail,
  PlatformTenantSubscription,
} from "../../domain/entities";

vi.mock("../../infrastructure/platformApi", () => ({
  platformApi: {
    getTenantSubscription: vi.fn(),
    updateDeclaredFleet: vi.fn(),
  },
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
  };
});

const mockedApi = vi.mocked(platformApi);

const baseTenant: PlatformTenantDetail = {
  id: "tenant-1",
  name: "Acme",
  subdomain: "acme",
  status: "active",
  subscriptionStatus: "active",
  planCode: "operacion_pequena",
  planName: "Operación Pequeña",
  declaredFleetBand: "11_30",
  declaredFleetUnits: 20,
  userCount: 2,
  branchCount: 1,
  tripCount: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  suspendedAt: null,
  healthScore: 80,
  lifecycleStage: "active",
  healthAsOf: null,
  usage: { userCount: 2, branchCount: 1, tripCount: 0 },
  adminActivation: null,
  health: emptyPlatformTenantHealth(),
};

const subscription: PlatformTenantSubscription = {
  planCode: "operacion_pequena",
  planName: "Operación Pequeña",
  status: "active",
  billingCycle: "monthly",
  monthlyPriceCents: 0,
  includedStamps: 420,
  stampsUsedThisPeriod: 0,
  quotaPolicy: "soft_cap",
  currentPeriodStart: "2026-08-01T06:00:00.000Z",
  currentPeriodEnd: "2026-09-01T06:00:00.000Z",
  trialEndsAt: null,
  notes: null,
  limits: { maxUsers: null, maxBranches: null, historyMonths: 12 },
  capacityBandCode: "operacion_pequena",
  pendingCapacityBandCode: null,
  capacity: null,
  profitabilityLevel: "L0",
  pricePerMotrizCents: 31900,
  stampsPerMotriz: 30,
  bandQMin: 6,
  bandQMax: 30,
  overagePriceCents: 500,
  qFact: 14,
};

function renderControls(
  tenant: PlatformTenantDetail,
  canMutate = true,
  onManage = vi.fn(),
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <TenantGovernanceControls
        tenant={tenant}
        canMutate={canMutate}
        onManageSubscription={onManage}
      />
    </QueryClientProvider>,
  );
}

describe("TenantGovernanceControls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.getTenantSubscription.mockResolvedValue(subscription);
  });

  it("muestra flota declarada en lectura (banda 11_30)", async () => {
    renderControls(baseTenant);

    expect(
      await screen.findByText(
        platformCopy.tenants.detail.governance.declaredFleetLabel,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        platformCopy.tenants.detail.governance.declaredFleetValue(
          platformCopy.tenants.create.fleetBands["11_30"],
          20,
        ),
      ),
    ).toBeInTheDocument();
  });

  it("muestra Sin declarar cuando no hay banda", async () => {
    renderControls({
      ...baseTenant,
      declaredFleetBand: null,
      declaredFleetUnits: null,
    });

    expect(
      await screen.findByText(
        platformCopy.tenants.detail.governance.declaredFleetNone,
      ),
    ).toBeInTheDocument();
  });

  it("no muestra badges Acceso/Suscripción (canónicos en strip)", async () => {
    renderControls(baseTenant);
    await screen.findByText(
      platformCopy.tenants.detail.governance.accessEffect.active,
    );
    expect(
      screen.queryByText(
        platformCopy.tenants.detail.subscription.statusLabels.active,
      ),
    ).not.toBeInTheDocument();
  });

  it("past_due: sin DetailAlertCard gemelo; orientación + Gestionar secundaria", async () => {
    mockedApi.getTenantSubscription.mockResolvedValue({
      ...subscription,
      status: "past_due",
    });
    const onManage = vi.fn();
    const user = userEvent.setup();

    renderControls(
      { ...baseTenant, subscriptionStatus: "past_due" },
      true,
      onManage,
    );

    expect(
      await screen.findByText(
        platformCopy.tenants.detail.governance.commercialEffect.past_due,
      ),
    ).toBeInTheDocument();
    // Old twin alert title removed
    expect(
      screen.queryByText("Cobro pendiente — acción manual"),
    ).not.toBeInTheDocument();

    const cta = screen.getByRole("button", {
      name: platformCopy.tenants.detail.governance.grace.openSubscription,
    });
    await user.click(cta);
    expect(onManage).toHaveBeenCalled();
  });

  it("support RO past_due: sin CTA Gestionar", async () => {
    mockedApi.getTenantSubscription.mockResolvedValue({
      ...subscription,
      status: "past_due",
    });

    renderControls({ ...baseTenant, subscriptionStatus: "past_due" }, false);

    expect(
      await screen.findByText(
        platformCopy.tenants.detail.governance.grace.readOnlyHint,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: platformCopy.tenants.detail.governance.grace.openSubscription,
      }),
    ).not.toBeInTheDocument();
  });

  it("owner: puede abrir editor de flota declarada", async () => {
    const user = userEvent.setup();
    renderControls(baseTenant);

    await user.click(
      await screen.findByRole("button", {
        name: platformCopy.tenants.detail.governance.declaredFleetEdit,
      }),
    );
    expect(
      screen.getByLabelText(
        platformCopy.tenants.detail.governance.declaredFleetBandLabel,
      ),
    ).toBeInTheDocument();
  });
});
