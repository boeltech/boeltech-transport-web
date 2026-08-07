/**
 * Smoke ADR-0072 WS-D — tenant saldo AR: julio open en agosto → mark paid limpia saldo.
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
  BillingSubscription,
  BillingUsage,
} from "@features/billing/domain/entities";
import { TooltipProvider } from "@shared/ui/tooltip";
import { PermissionProvider } from "@app/providers/PermissionProvider";

const mockGetSubscription = vi.fn();
const mockGetUsage = vi.fn();
const mockGetEntitlements = vi.fn();
const mockGetArrears = vi.fn();

vi.mock("@features/billing/infrastructure/billingApi", () => ({
  billingApi: {
    getSubscription: (...args: unknown[]) => mockGetSubscription(...args),
    getUsage: (...args: unknown[]) => mockGetUsage(...args),
    getEntitlements: (...args: unknown[]) => mockGetEntitlements(...args),
    getArrears: (...args: unknown[]) => mockGetArrears(...args),
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
  profitabilityLevel: "L0",
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

const EMPTY_ARREARS: BillingArrears = {
  currency: "MXN",
  openCount: 0,
  totalOpenCents: 0,
  oldestDueDate: null,
  maxDaysOverdue: 0,
  invoices: [],
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

describe("billing AR smoke (ADR-0072 WS-D)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSubscription.mockResolvedValue(MOCK_SUBSCRIPTION);
    mockGetUsage.mockResolvedValue(MOCK_USAGE);
    mockGetEntitlements.mockResolvedValue(MOCK_ENTITLEMENTS);
    mockGetArrears.mockResolvedValue(EMPTY_ARREARS);
  });

  it("S2: shows July open balance while August is current and status active", async () => {
    mockGetArrears.mockResolvedValue(JULY_OPEN_ARREARS);

    render(
      <TestProviders>
        <BillingSubscriptionPage />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(
        screen.getAllByText(billingCopy.notices.arrears.title).length,
      ).toBeGreaterThan(0);
    });

    expect(screen.getAllByText(billingCopy.arrears.title).length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText(/\$2,154\.24/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/jul 2026/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(billingCopy.costs.title)).toBeInTheDocument();
  });

  it("S4: after mark paid (empty arrears) saldo pendiente disappears", async () => {
    mockGetArrears.mockResolvedValue(EMPTY_ARREARS);

    render(
      <TestProviders>
        <BillingSubscriptionPage />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(screen.getByText(billingCopy.costs.title)).toBeInTheDocument();
    });

    expect(
      screen.queryByText(billingCopy.notices.arrears.title),
    ).not.toBeInTheDocument();
    // Card title only appears in notice/card — should not be present as Saldo pendiente card
    const saldoTitles = screen.queryAllByText(billingCopy.arrears.title);
    expect(saldoTitles).toHaveLength(0);
  });
});
