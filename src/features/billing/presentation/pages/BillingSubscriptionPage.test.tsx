import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { PermissionProvider } from "@app/providers/PermissionProvider";
import { TooltipProvider } from "@shared/ui/tooltip";
import type {
  BillingEntitlements,
  BillingSubscription,
  BillingUsage,
} from "../../domain/entities";
import { billingCopy } from "../copy/billingCopy";
import { BillingSubscriptionPage } from "./BillingSubscriptionPage";

const mockGetAccess = vi.fn();
const mockGetSubscription = vi.fn();
const mockGetUsage = vi.fn();
const mockGetEntitlements = vi.fn();
const mockGetArrears = vi.fn();
const mockListPaymentMethods = vi.fn();

vi.mock("../../infrastructure/billingApi", () => ({
  billingApi: {
    getAccess: (...args: unknown[]) => mockGetAccess(...args),
    getSubscription: (...args: unknown[]) => mockGetSubscription(...args),
    getUsage: (...args: unknown[]) => mockGetUsage(...args),
    getEntitlements: (...args: unknown[]) => mockGetEntitlements(...args),
    getArrears: (...args: unknown[]) => mockGetArrears(...args),
    listSaasInvoices: vi.fn().mockResolvedValue([]),
    listPaymentMethods: (...args: unknown[]) =>
      mockListPaymentMethods(...args),
  },
}));

vi.mock("../../infrastructure/stripeClient", () => ({
  isStripePublishableConfigured: () => true,
  isSaasStripeNotConfiguredError: () => false,
  getStripePromise: () => null,
}));

vi.mock("@features/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/auth")>();
  return {
    ...actual,
    useAuth: () => ({
      user: {
        id: "u1",
        role: "admin",
        tenantId: "t1",
        email: "admin@example.com",
        fullName: "Admin",
      },
      isAuthenticated: true,
    }),
  };
});

vi.mock("@features/branches", () => ({
  useBranches: () => ({ data: undefined }),
}));

const SUB: BillingSubscription = {
  planCode: "operacion_esencial",
  planName: "Operación Esencial",
  status: "active",
  billingCycle: "monthly",
  monthlyPriceCents: 74900,
  includedStamps: 120,
  stampsUsedThisPeriod: 45,
  quotaPolicy: "soft_cap",
  currentPeriodStart: "2026-07-01T06:00:00.000Z",
  currentPeriodEnd: "2026-08-01T05:59:59.999Z",
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

const USAGE: BillingUsage = {
  tenantId: "t1",
  planCode: "operacion_esencial",
  periodKey: "2026-07",
  currentPeriodStart: "2026-07-01T06:00:00.000Z",
  currentPeriodEnd: "2026-08-01T05:59:59.999Z",
  includedStamps: 120,
  stampsUsed: 45,
  overageStamps: 0,
  overagePriceCents: 600,
  overageTotalCents: 0,
  quotaPolicy: "soft_cap",
  prepaidRemaining: 0,
  prepaidConsumed: 0,
  history: [],
};

const ENTITLEMENTS: BillingEntitlements = {
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
    periodKey: "2026-07",
    billingCycle: "monthly",
  },
};

const DEFAULT_PM = {
  id: "pm_1",
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
    defaultOptions: { queries: { retry: false } },
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

describe("BillingSubscriptionPage layout (F1–F3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAccess.mockResolvedValue({
      subscriptionStatus: "active",
      isOperational: true,
      trialEndsAt: null,
      planName: "Operación Esencial",
      effectiveModuleCodes: [],
    });
    mockGetSubscription.mockResolvedValue(SUB);
    mockGetUsage.mockResolvedValue(USAGE);
    mockGetEntitlements.mockResolvedValue(ENTITLEMENTS);
    mockGetArrears.mockResolvedValue({
      currency: "MXN",
      openCount: 0,
      totalOpenCents: 0,
      oldestDueDate: null,
      maxDaysOverdue: 0,
      invoices: [],
    });
    mockListPaymentMethods.mockResolvedValue([DEFAULT_PM]);
  });

  it("keeps history collapsed by default and expands on demand", async () => {
    const user = userEvent.setup();
    render(
      <TestProviders>
        <BillingSubscriptionPage />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(screen.getByText("Operación Esencial")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", {
        name: new RegExp(billingCopy.sections.history.title),
      }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByText(billingCopy.saasInvoiceHistory.emptyTitle),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: new RegExp(billingCopy.sections.history.title),
      }),
    );

    expect(
      await screen.findByText(billingCopy.saasInvoiceHistory.emptyTitle),
    ).toBeInTheDocument();
  });

  it("shows pay-zone disclaimer once and contact as mailto link", async () => {
    mockListPaymentMethods.mockResolvedValue([]);

    render(
      <TestProviders>
        <BillingSubscriptionPage />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(billingCopy.payZone.saasDisclaimer),
      ).toBeInTheDocument();
    });

    expect(
      screen.getAllByText(billingCopy.payZone.saasDisclaimer),
    ).toHaveLength(1);
    expect(
      screen.getByRole("link", { name: billingCopy.contact.cta }),
    ).toHaveAttribute("href", `mailto:${billingCopy.contact.email}`);
  });

  it("collapses payment methods when current and default card exists", async () => {
    render(
      <TestProviders>
        <BillingSubscriptionPage />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: new RegExp(billingCopy.sections.paymentMethod.title),
        }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", {
        name: new RegExp(billingCopy.sections.paymentMethod.title),
      }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByText(billingCopy.paymentMethods.title),
    ).not.toBeInTheDocument();
  });

  it("keeps plan detail collapsed and surfaces summary estimate above the fold", async () => {
    render(
      <TestProviders>
        <BillingSubscriptionPage />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(billingCopy.planSummary.estimatedLabel),
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/\$868\.84/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: new RegExp(billingCopy.sections.planDetail.title),
      }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByText(billingCopy.modules.title),
    ).not.toBeInTheDocument();
  });
});
