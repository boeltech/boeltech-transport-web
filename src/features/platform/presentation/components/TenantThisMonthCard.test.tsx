import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TenantThisMonthCard } from "./TenantThisMonthCard";
import { platformCopy } from "../copy/platformCopy";
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
  profitabilityLevel: "L0",
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
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <TenantThisMonthCard tenantId="tenant-1" canExport />
      </QueryClientProvider>,
    );

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
});
