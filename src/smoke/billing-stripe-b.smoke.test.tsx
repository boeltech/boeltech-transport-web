/**
 * Smoke Stripe-B F3 — franja/chip de auto-cargo + Alert tenant + copy PM.
 * Mock de API; no requiere backend ni Playwright.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BillingSubscriptionPage } from "@features/billing/presentation/pages/BillingSubscriptionPage";
import { billingCopy } from "@features/billing/presentation/copy/billingCopy";
import type {
  BillingArrears,
  BillingEntitlements,
  BillingPaymentMethod,
  BillingSubscription,
  BillingUsage,
} from "@features/billing/domain/entities";
import { TenantSaasArCard } from "@features/platform/presentation/components/TenantSaasArCard";
import { platformCopy } from "@features/platform/presentation/copy/platformCopy";
import { formatBillingPeriodKey } from "@features/platform/presentation/utils/platformBillingFormatters";
import { TooltipProvider } from "@shared/ui/tooltip";
import { PermissionProvider } from "@app/providers/PermissionProvider";

const mockGetAccess = vi.fn();
const mockGetSubscription = vi.fn();
const mockGetUsage = vi.fn();
const mockGetEntitlements = vi.fn();
const mockGetArrears = vi.fn();
const mockListPaymentMethods = vi.fn();
const mockListTenantSaasInvoices = vi.fn();
const mockListTenantPaymentMethods = vi.fn();
const mockGetArChargeRun = vi.fn();
const mockGetArCloseRun = vi.fn();

const isStripePublishableConfigured = vi.fn(() => true);

vi.mock("@features/billing/infrastructure/stripeClient", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@features/billing/infrastructure/stripeClient")
    >();
  return {
    ...actual,
    isStripePublishableConfigured: () => isStripePublishableConfigured(),
    getStripePromise: () => Promise.resolve(null),
  };
});

vi.mock("@features/billing/infrastructure/billingApi", () => ({
  billingApi: {
    getAccess: (...args: unknown[]) => mockGetAccess(...args),
    getSubscription: (...args: unknown[]) => mockGetSubscription(...args),
    getUsage: (...args: unknown[]) => mockGetUsage(...args),
    getEntitlements: (...args: unknown[]) => mockGetEntitlements(...args),
    getArrears: (...args: unknown[]) => mockGetArrears(...args),
    listPaymentMethods: (...args: unknown[]) => mockListPaymentMethods(...args),
    createSetupIntent: vi.fn(),
    confirmSetupIntent: vi.fn(),
    setDefaultPaymentMethod: vi.fn(),
    deletePaymentMethod: vi.fn(),
    paySaasInvoice: vi.fn(),
  },
}));

vi.mock("@features/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/auth")>();
  return {
    ...actual,
    useAuth: () => ({
      isAuthenticated: true,
      isLoading: false,
      user: {
        id: "user-1",
        email: "admin@test.com",
        firstName: "Ada",
        lastName: "Lovelace",
        role: "admin",
        tenant: { id: "tenant-1", name: "Test", subdomain: "test" },
        onboardingCompletedAt: "2026-01-01T00:00:00.000Z",
      },
      token: "test-token",
      login: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
      replaceSessionUser: vi.fn(),
      setUser: vi.fn(),
    }),
  };
});

vi.mock("@features/platform/infrastructure/platformApi", () => ({
  platformApi: {
    listTenantSaasInvoices: (...args: unknown[]) =>
      mockListTenantSaasInvoices(...args),
    listTenantPaymentMethods: (...args: unknown[]) =>
      mockListTenantPaymentMethods(...args),
    chargeSaasInvoiceStripe: vi.fn(),
    downloadTenantReconciliationCsv: vi.fn(),
    getTenantReconciliationJson: vi.fn(),
    issueSaasInvoice: vi.fn(),
    markSaasInvoicePaid: vi.fn(),
    voidSaasInvoice: vi.fn(),
    getArChargeRun: (...args: unknown[]) => mockGetArChargeRun(...args),
    getArCloseRun: (...args: unknown[]) => mockGetArCloseRun(...args),
  },
}));

vi.mock("@features/billing", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/billing")>();
  return {
    ...actual,
    isStripePublishableConfigured: () => isStripePublishableConfigured(),
  };
});

const MOCK_SUBSCRIPTION: BillingSubscription = {
  planCode: "operacion_esencial",
  planName: "Operación Esencial",
  status: "active",
  billingCycle: "monthly",
  monthlyPriceCents: 74900,
  includedStamps: 120,
  stampsUsedThisPeriod: 10,
  quotaPolicy: "soft_cap",
  currentPeriodStart: "2026-08-01T06:00:00.000Z",
  currentPeriodEnd: "2026-09-01T05:59:59.999Z",
  trialEndsAt: null,
  notes: null,
  limits: { maxUsers: 3, maxBranches: 1, historyMonths: 6 },
  capacityBandCode: "operacion_esencial",
  pendingCapacityBandCode: null,
  capacity: {
    bandCode: "operacion_esencial",
    pendingBandCode: null,
    users: {
      granted: 3,
      usage: 1,
      limitReached: false,
      overQuota: false,
      overQuotaCount: 0,
      status: "within_limit",
    },
    branches: {
      granted: 1,
      usage: 1,
      limitReached: true,
      overQuota: false,
      overQuotaCount: 0,
      status: "within_limit",
    },
    historyMonths: { granted: 6 },
  },
  profitabilityLevel: "L0",
  pricePerMotrizCents: null,
  stampsPerMotriz: 30,
  bandQMin: null,
  bandQMax: null,
  overagePriceCents: 600,
  qFact: null,
};

const MOCK_USAGE: BillingUsage = {
  tenantId: "tenant-1",
  planCode: "operacion_esencial",
  periodKey: "2026-08",
  currentPeriodStart: "2026-08-01T06:00:00.000Z",
  currentPeriodEnd: "2026-09-01T05:59:59.999Z",
  includedStamps: 120,
  stampsUsed: 10,
  overageStamps: 0,
  overagePriceCents: 600,
  overageTotalCents: 0,
  quotaPolicy: "soft_cap",
  prepaidRemaining: 0,
  prepaidConsumed: 0,
  history: [{ periodKey: "2026-07", stampsUsed: 90, overageStamps: 0 }],
};

const MOCK_ENTITLEMENTS: BillingEntitlements = {
  directEntitlements: [],
  effectiveModuleCodes: [],
  profitabilityLevel: "L0",
  catalog: [],
  commercialSummary: {
    planMonthlyPriceCents: 74900,
    modulesTotalCents: 0,
    overageTotalCents: 0,
    subtotalCents: 74900,
    ivaCents: 11984,
    estimatedTotalCents: 86884,
    currency: "MXN",
    periodKey: "2026-08",
    billingCycle: "monthly",
  },
};

const FAILED_ARREARS: BillingArrears = {
  currency: "MXN",
  openCount: 1,
  totalOpenCents: 215424,
  oldestDueDate: "2026-08-15T05:59:59.999Z",
  maxDaysOverdue: 0,
  invoices: [
    {
      id: "inv-july",
      periodKey: "2026-07",
      status: "open",
      totalCents: 215424,
      amountDueCents: 215424,
      dueDate: "2026-08-15T05:59:59.999Z",
      daysOverdue: 0,
      issuedAt: "2026-08-01T16:00:00.000Z",
      lastAutoCharge: {
        outcome: "failed",
        skipReason: null,
        failureCode: "card_declined",
        createdAt: "2026-08-02T12:00:00.000Z",
      },
    },
  ],
};

const DEFAULT_PM: BillingPaymentMethod = {
  id: "pm-1",
  tenantId: "tenant-1",
  gateway: "stripe",
  gatewayPaymentMethodId: "pm_stripe_1",
  brand: "visa",
  last4: "4242",
  expMonth: 12,
  expYear: 2030,
  isDefault: true,
  createdAt: "2026-08-01T16:00:00.000Z",
  updatedAt: "2026-08-01T16:00:00.000Z",
};

const OPEN_INVOICE = {
  id: "inv-july",
  tenantId: "tenant-1",
  subscriptionId: "sub-1",
  periodKey: "2026-07",
  periodStart: "2026-07-01T06:00:00.000Z",
  periodEnd: "2026-08-01T06:00:00.000Z",
  status: "open" as const,
  currency: "MXN",
  planCode: "operacion_esencial",
  stampsIncluded: 120,
  stampsUsed: 10,
  stampsOverage: 0,
  subtotalCents: 185710,
  taxCents: 29714,
  totalCents: 215424,
  amountDueCents: 215424,
  amountPaidCents: 0,
  issuedAt: "2026-08-01T16:00:00.000Z",
  dueDate: "2026-08-15T16:00:00.000Z",
  paidAt: null,
  voidedAt: null,
  voidReason: null,
  notes: null,
  daysOverdue: 0,
  origin: "auto_period_issue" as const,
  createdAt: "2026-08-01T16:00:00.000Z",
  updatedAt: "2026-08-01T16:00:00.000Z",
};

function TestProviders({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <PermissionProvider>
        <TooltipProvider delayDuration={0}>
          <MemoryRouter>{children}</MemoryRouter>
        </TooltipProvider>
      </PermissionProvider>
    </QueryClientProvider>
  );
}

describe("billing-stripe-b smoke (Stripe-B F3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isStripePublishableConfigured.mockReturnValue(true);
    mockGetAccess.mockResolvedValue({
      subscriptionStatus: "active",
      isOperational: true,
      trialEndsAt: null,
      planName: "Operación Esencial",
      effectiveModuleCodes: [],
    });
    mockGetSubscription.mockResolvedValue(MOCK_SUBSCRIPTION);
    mockGetUsage.mockResolvedValue(MOCK_USAGE);
    mockGetEntitlements.mockResolvedValue(MOCK_ENTITLEMENTS);
    mockGetArrears.mockResolvedValue(FAILED_ARREARS);
    mockListPaymentMethods.mockResolvedValue([DEFAULT_PM]);
    mockListTenantSaasInvoices.mockResolvedValue([OPEN_INVOICE]);
    mockListTenantPaymentMethods.mockResolvedValue([DEFAULT_PM]);
    mockGetArCloseRun.mockResolvedValue({
      data: {
        periodKey: "2026-07",
        run: {
          ran: true,
          ranAt: "2026-08-01T06:05:00.000Z",
          issuedCount: 1,
          consideredCount: 1,
          errorsCount: 0,
        },
        counts: { actionable: 0, policy: 0 },
        items: [],
      },
      pagination: { page: 1, limit: 25, total: 0, totalPages: 0 },
    });
    mockGetArChargeRun.mockResolvedValue({
      data: {
        run: {
          ran: true,
          id: "run-1",
          ranAt: "2026-08-02T12:00:00.000Z",
          trigger: "job_tick",
          considered: 1,
          charged: 0,
          errors: 0,
        },
        counts: {
          charged: 0,
          noPaymentMethod: 0,
          failed: 1,
          requiresAction: 0,
          processing: 0,
          skippedOther: 0,
        },
        items: [],
        latestAttempts: [
          {
            saasInvoiceId: "inv-july",
            outcome: "failed",
            skipReason: null,
            failureCode: "card_declined",
            createdAt: "2026-08-02T12:00:00.000Z",
          },
        ],
      },
      pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
    });
  });

  it("tenant: failed auto-charge shows persist alert and keeps Pagar ahora", async () => {
    render(
      <TestProviders>
        <BillingSubscriptionPage />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(billingCopy.arrears.autoChargeFailed),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText(billingCopy.arrears.autoChargeFailedHint),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: billingCopy.arrears.payNow }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(billingCopy.paymentMethods.autoChargeHint),
    ).toBeInTheDocument();
    expect(billingCopy.arrears.autoChargeFailed).not.toMatch(/CFDI|flete/i);
    expect(
      screen.queryByText(platformCopy.ar.skipReasons.CUT_NO_FLEET),
    ).not.toBeInTheDocument();
  });

  it("platform: failed attempt chip is not an emission exception; override CTAs stay", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <TenantSaasArCard
            tenantId="tenant-1"
            tenantLabel="Demo"
            canMutate
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(
      await screen.findByText(formatBillingPeriodKey("2026-07")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(platformCopy.ar.chargeChip.failed),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(platformCopy.ar.skipReasons.CUT_NO_FLEET),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByRole("button", {
        name: platformCopy.ar.actions.chargeStripe,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: platformCopy.ar.actions.markPaid }),
    ).toBeInTheDocument();
  });
});
