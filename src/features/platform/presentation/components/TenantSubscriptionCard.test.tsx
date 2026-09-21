import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { BillingCapacity } from "@features/billing";
import { TenantSubscriptionCard } from "./TenantSubscriptionCard";
import { platformCopy } from "../copy/platformCopy";
import { formatBillingPriceCents } from "../utils/platformBillingFormatters";
import { platformApi } from "../../infrastructure/platformApi";
import type {
  PlatformTenantStampUsage,
  PlatformTenantSubscription,
} from "../../domain/entities";

vi.mock("../../infrastructure/platformApi", () => ({
  platformApi: {
    getTenantSubscription: vi.fn(),
    getTenantStampUsage: vi.fn(),
  },
}));

const mockedApi = vi.mocked(platformApi);
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

const legacySubscription: PlatformTenantSubscription = {
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
  ...legacySubscription,
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

function renderCard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <TenantSubscriptionCard tenantId="tenant-1" />
    </QueryClientProvider>,
  );
}

describe("TenantSubscriptionCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.getTenantSubscription.mockResolvedValue(legacySubscription);
    mockedApi.getTenantStampUsage.mockResolvedValue(usage);
  });

  it("legacy flat: fila Precio muestra monthlyPriceCents", async () => {
    renderCard();
    expect(
      await screen.findByText(formatBillingPriceCents(150000)),
    ).toBeInTheDocument();
    expect(screen.getByText(planPriceCopy.labelLegacy)).toBeInTheDocument();
  });

  it("motriz Q=14 P=31900¢: fila muestra cargo 446600¢, no $0", async () => {
    mockedApi.getTenantSubscription.mockResolvedValue(motrizSubscription);
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
    expect(
      screen.queryByText(formatBillingPriceCents(0)),
    ).not.toBeInTheDocument();
  });

  it("motriz sin Q: $/motriz + pending", async () => {
    mockedApi.getTenantSubscription.mockResolvedValue({
      ...motrizSubscription,
      qFact: null,
    });
    renderCard();

    expect(
      await screen.findByText(
        planPriceCopy.pricePerMotriz(formatBillingPriceCents(31900)),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(planPriceCopy.pendingQ)).toBeInTheDocument();
  });

  it("Grande / cotización: copy SOW, sin inventar P", async () => {
    mockedApi.getTenantSubscription.mockResolvedValue({
      ...motrizSubscription,
      planCode: "operacion_grande",
      planName: "Operación Grande",
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
  });

  it("muestra usage/granted de usuarios y sucursales + historial consultable", async () => {
    mockedApi.getTenantSubscription.mockResolvedValue({
      ...motrizSubscription,
      limits: {
        maxUsers: 15,
        maxBranches: 3,
        historyMonths: 24,
      },
      capacity: withinCapacity({
        bandCode: "operacion_pequena",
        users: {
          granted: 15,
          usage: 8,
          limitReached: false,
          overQuota: false,
          overQuotaCount: 0,
          status: "within_limit",
        },
        branches: {
          granted: 3,
          usage: 2,
          limitReached: false,
          overQuota: false,
          overQuotaCount: 0,
          status: "within_limit",
        },
        historyMonths: { granted: 24 },
      }),
    });
    renderCard();

    expect(await screen.findByText("8 / 15")).toBeInTheDocument();
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    expect(
      screen.getByText(
        platformCopy.tenants.detail.subscription.historyMonthsConsultable(24),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        platformCopy.tenants.detail.subscription.fields.historyConsultable,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/retención/i)).not.toBeInTheDocument();
  });

  it("muestra hint OVER_LIMIT y pending band", async () => {
    mockedApi.getTenantSubscription.mockResolvedValue({
      ...motrizSubscription,
      pendingCapacityBandCode: "operacion_micro",
      capacity: withinCapacity({
        bandCode: "operacion_pequena",
        pendingBandCode: "operacion_micro",
        users: {
          granted: 5,
          usage: 8,
          limitReached: true,
          overQuota: true,
          overQuotaCount: 3,
          status: "over_limit",
        },
      }),
    });
    renderCard();

    expect(await screen.findByText("8 / 5")).toBeInTheDocument();
    expect(
      screen.getByText(
        platformCopy.tenants.detail.subscription.overLimitHint,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        platformCopy.tenants.detail.subscription.pendingBandHint,
      ),
    ).toBeInTheDocument();
  });
});
