import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { BillingCapacity } from "@features/billing";
import { TenantThisMonthCard } from "./TenantThisMonthCard";
import { platformCopy } from "../copy/platformCopy";
import { formatBillingPriceCents } from "../utils/platformBillingFormatters";
import { platformApi } from "../../infrastructure/platformApi";
import type {
  PlatformTenantEntitlements,
  PlatformTenantStampUsage,
  PlatformTenantSubscription,
} from "../../domain/entities";

vi.mock("../../infrastructure/platformApi", () => ({
  platformApi: {
    getTenantSubscription: vi.fn(),
    getTenantStampUsage: vi.fn(),
    getTenantEntitlements: vi.fn(),
    downloadTenantReconciliationCsv: vi.fn(),
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
const stampCopy = platformCopy.tenants.detail.stampUsage;
const planPriceCopy = platformCopy.tenants.detail.planPrice;

const withinCapacity = (
  overrides: Partial<BillingCapacity> = {},
): BillingCapacity => ({
  bandCode: "operacion_crecimiento",
  pendingBandCode: null,
  users: {
    granted: null,
    usage: null,
    limitReached: false,
    overQuota: false,
    overQuotaCount: 0,
    status: "within_limit",
  },
  branches: {
    granted: null,
    usage: null,
    limitReached: false,
    overQuota: false,
    overQuotaCount: 0,
    status: "within_limit",
  },
  historyMonths: { granted: 12 },
  ...overrides,
});

const subscription: PlatformTenantSubscription = {
  planCode: "operacion_crecimiento",
  planName: "Crecimiento",
  status: "active",
  billingCycle: "monthly",
  monthlyPriceCents: 150000,
  includedStamps: 380,
  stampsUsedThisPeriod: 10,
  quotaPolicy: "soft_cap",
  currentPeriodStart: "2026-08-01T06:00:00.000Z",
  currentPeriodEnd: "2026-09-01T06:00:00.000Z",
  trialEndsAt: null,
  notes: null,
  limits: {
    maxUsers: null,
    maxBranches: null,
    historyMonths: 12,
  },
  capacityBandCode: "operacion_crecimiento",
  pendingCapacityBandCode: null,
  capacity: withinCapacity(),
  profitabilityLevel: "L0",
  pricePerMotrizCents: null,
  stampsPerMotriz: 30,
  bandQMin: null,
  bandQMax: null,
  overagePriceCents: 1000,
  qFact: null,
};

const motrizSubscription: PlatformTenantSubscription = {
  ...subscription,
  planCode: "operacion_pequena",
  planName: "Operación Pequeña",
  monthlyPriceCents: 0,
  includedStamps: 420,
  capacityBandCode: "operacion_pequena",
  capacity: withinCapacity({ bandCode: "operacion_pequena" }),
  pricePerMotrizCents: 31900,
  stampsPerMotriz: 30,
  bandQMin: 6,
  bandQMax: 30,
  overagePriceCents: 500,
  qFact: 14,
};

const usage: PlatformTenantStampUsage = {
  tenantId: "tenant-1",
  planCode: "operacion_crecimiento",
  periodKey: "2026-08",
  includedStamps: 380,
  stampsUsed: 10,
  overageStamps: 0,
  overageTotalCents: 0,
  quotaPolicy: "soft_cap",
  prepaidRemaining: 0,
  prepaidConsumed: 0,
};

const entitlements: PlatformTenantEntitlements = {
  directEntitlements: [],
  effectiveModuleCodes: [],
  profitabilityLevel: "L0",
  catalog: [],
  commercialSummary: {
    periodKey: "2026-08",
    planMonthlyPriceCents: 150000,
    modulesTotalCents: 0,
    overageTotalCents: 0,
    subtotalCents: 150000,
    ivaCents: 24000,
    estimatedTotalCents: 174000,
    currency: "MXN",
    billingCycle: "monthly",
  },
};

function renderCard(canExport = false) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <TenantThisMonthCard tenantId="tenant-1" canExport={canExport} />
    </QueryClientProvider>,
  );
}

describe("TenantThisMonthCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.getTenantSubscription.mockResolvedValue(subscription);
    mockedApi.getTenantStampUsage.mockResolvedValue(usage);
    mockedApi.getTenantEntitlements.mockResolvedValue(entitlements);
    mockedApi.downloadTenantReconciliationCsv.mockResolvedValue(undefined);
  });

  it("downloads estimate CSV for the current usage period", async () => {
    const user = userEvent.setup();
    renderCard(true);

    await user.click(
      await screen.findByRole("button", { name: stampCopy.exportCsv }),
    );

    await waitFor(() => {
      expect(mockedApi.downloadTenantReconciliationCsv).toHaveBeenCalledWith(
        "tenant-1",
        "2026-08",
      );
    });
    expect(screen.getByText(stampCopy.exportEstimateHint)).toBeInTheDocument();
  });

  it("legacy flat: muestra monthlyPriceCents (grandfather)", async () => {
    renderCard();
    expect(
      await screen.findByText(formatBillingPriceCents(150000)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(platformCopy.tenants.detail.metrics.monthlyPrice),
    ).toBeInTheDocument();
  });

  it("motriz Q=14 P=31900¢: hero muestra cargo 446600¢, no $0", async () => {
    mockedApi.getTenantSubscription.mockResolvedValue(motrizSubscription);
    mockedApi.getTenantStampUsage.mockResolvedValue({
      ...usage,
      planCode: "operacion_pequena",
      includedStamps: 420,
    });
    mockedApi.getTenantEntitlements.mockResolvedValue({
      ...entitlements,
      commercialSummary: {
        ...entitlements.commercialSummary,
        planMonthlyPriceCents: 446600,
        subtotalCents: 446600,
        ivaCents: 71456,
        estimatedTotalCents: 518056,
      },
    });

    renderCard();

    expect(
      await screen.findByText(formatBillingPriceCents(446600)),
    ).toBeInTheDocument();
    expect(screen.getByText(planPriceCopy.labelCargo)).toBeInTheDocument();
    expect(
      screen.getByText(
        planPriceCopy.cargoHint(formatBillingPriceCents(31900), 14),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(planPriceCopy.bolsaHint(30, 14))).toBeInTheDocument();
    expect(
      screen.queryByText(formatBillingPriceCents(0)),
    ).not.toBeInTheDocument();
  });

  it("motriz sin Q: muestra $/motriz + pending, no $0 flat", async () => {
    mockedApi.getTenantSubscription.mockResolvedValue({
      ...motrizSubscription,
      qFact: null,
      includedStamps: 0,
    });
    mockedApi.getTenantStampUsage.mockResolvedValue({
      ...usage,
      planCode: "operacion_pequena",
      includedStamps: 0,
      stampsUsed: 0,
    });

    renderCard();

    expect(
      await screen.findByText(
        planPriceCopy.pricePerMotriz(formatBillingPriceCents(31900)),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(planPriceCopy.pendingQ)).toBeInTheDocument();
    expect(
      screen.queryByText(formatBillingPriceCents(0)),
    ).not.toBeInTheDocument();
  });

  it("Grande / cotización: no inventa P", async () => {
    mockedApi.getTenantSubscription.mockResolvedValue({
      ...motrizSubscription,
      planCode: "operacion_grande",
      planName: "Operación Grande",
      monthlyPriceCents: 0,
      pricePerMotrizCents: null,
      bandQMin: 101,
      bandQMax: null,
      qFact: 120,
      capacityBandCode: "operacion_grande",
      capacity: withinCapacity({ bandCode: "operacion_grande" }),
    });

    renderCard();

    expect(await screen.findByText(planPriceCopy.quote)).toBeInTheDocument();
    expect(screen.getByText(planPriceCopy.quoteHint)).toBeInTheDocument();
    expect(
      screen.queryByText(formatBillingPriceCents(0)),
    ).not.toBeInTheDocument();
  });
});
