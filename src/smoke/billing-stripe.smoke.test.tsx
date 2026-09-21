/**
 * Smoke Stripe-A WS-E — tenant «Pagar ahora» + platform «Cobrar con Stripe».
 * Mock de API / publishable key; no requiere backend ni Playwright.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
const mockPaySaasInvoice = vi.fn();

const isStripePublishableConfigured = vi.fn(() => false);

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
    paySaasInvoice: (...args: unknown[]) => mockPaySaasInvoice(...args),
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

const mockListTenantSaasInvoices = vi.fn();
const mockListTenantPaymentMethods = vi.fn();
const mockChargeSaasInvoiceStripe = vi.fn();

vi.mock("@features/platform/infrastructure/platformApi", () => ({
  platformApi: {
    listTenantSaasInvoices: (...args: unknown[]) =>
      mockListTenantSaasInvoices(...args),
    listTenantPaymentMethods: (...args: unknown[]) =>
      mockListTenantPaymentMethods(...args),
    chargeSaasInvoiceStripe: (...args: unknown[]) =>
      mockChargeSaasInvoiceStripe(...args),
    downloadTenantReconciliationCsv: vi.fn(),
    getTenantReconciliationJson: vi.fn(),
    issueSaasInvoice: vi.fn(),
    markSaasInvoicePaid: vi.fn(),
    voidSaasInvoice: vi.fn(),
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

const JULY_OPEN_ARREARS: BillingArrears = {
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

describe("billing-stripe smoke (Stripe-A WS-E)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isStripePublishableConfigured.mockReturnValue(false);
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
    mockGetArrears.mockResolvedValue(JULY_OPEN_ARREARS);
    mockListPaymentMethods.mockResolvedValue([DEFAULT_PM]);
    mockPaySaasInvoice.mockResolvedValue({
      saasInvoiceId: "inv-july",
      status: "paid",
      gatewayPaymentId: "pi_smoke",
      amountCents: 215424,
    });
    mockListTenantSaasInvoices.mockResolvedValue([
      {
        id: "inv-1",
        tenantId: "tenant-1",
        subscriptionId: "sub-1",
        periodKey: "2026-07",
        periodStart: "2026-07-01T06:00:00.000Z",
        periodEnd: "2026-08-01T06:00:00.000Z",
        status: "open",
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
        createdAt: "2026-08-01T16:00:00.000Z",
        updatedAt: "2026-08-01T16:00:00.000Z",
      },
    ]);
    mockListTenantPaymentMethods.mockResolvedValue([
      {
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
      },
    ]);
  });

  it("tenant: without publishable key hides Pagar ahora and métodos de pago", async () => {
    isStripePublishableConfigured.mockReturnValue(false);

    render(
      <TestProviders>
        <BillingSubscriptionPage />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(
        screen.getAllByText(billingCopy.arrears.title).length,
      ).toBeGreaterThan(0);
    });

    expect(
      screen.queryByRole("button", { name: billingCopy.arrears.payNow }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(billingCopy.paymentMethods.title),
    ).not.toBeInTheDocument();
    expect(mockListPaymentMethods).not.toHaveBeenCalled();
  });

  it("tenant: with Stripe ready shows masked card and Pagar ahora pays open invoice", async () => {
    const user = userEvent.setup();
    isStripePublishableConfigured.mockReturnValue(true);

    render(
      <TestProviders>
        <BillingSubscriptionPage />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(screen.getByText(/visa •••• 4242/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(billingCopy.paymentMethods.title),
    ).toBeInTheDocument();
    expect(
      screen.getByText(billingCopy.paymentMethods.defaultBadge),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/suscripción Boeltech/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(/facturas CFDI de flete/i),
    ).toBeInTheDocument();

    const payBtn = await screen.findByRole("button", {
      name: billingCopy.arrears.payNow,
    });
    await user.click(payBtn);

    await waitFor(() => {
      expect(mockPaySaasInvoice).toHaveBeenCalledWith("inv-july");
    });
  });

  it("platform: owner sees Cobrar con Stripe when publishable key and default PM exist", async () => {
    isStripePublishableConfigured.mockReturnValue(true);

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
      screen.getByText(platformCopy.ar.card.cardOnFile("4242")),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("button", {
        name: platformCopy.ar.actions.chargeStripe,
      }),
    ).toBeInTheDocument();
    // Dual-rail: mark-paid SPEI/manual sigue disponible
    expect(
      screen.getByRole("button", { name: platformCopy.ar.actions.markPaid }),
    ).toBeInTheDocument();
  });

  it("platform: without publishable key hides Cobrar con Stripe but keeps mark paid", async () => {
    isStripePublishableConfigured.mockReturnValue(false);

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
      screen.queryByRole("button", {
        name: platformCopy.ar.actions.chargeStripe,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: platformCopy.ar.actions.markPaid }),
    ).toBeInTheDocument();
  });
});
