/**
 * Smoke Imp-v1d — billing SaaS: subscription read-only + paywall equipo de apoyo.
 * Mock de API; no requiere backend ni Playwright.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { BasicInfoStep } from "@features/trips/presentation/pages/create/components/BasicInfoStep";
import {
  defaultWizardFormValues,
  type TripWizardFormValues,
} from "@features/trips/presentation/pages/create/components/validation";
import { BillingSubscriptionPage } from "@features/billing/presentation/pages/BillingSubscriptionPage";
import { billingCopy } from "@features/billing/presentation/copy/billingCopy";
import { basicInfoCopy } from "@features/trips/presentation/copy/wizard/basicInfoCopy";
import type {
  BillingEntitlements,
  BillingSubscription,
  BillingUsage,
} from "@features/billing/domain/entities";
import { INTERNAL_STAFF_MODULE_CODE } from "@features/billing/domain/entities";
import { TooltipProvider } from "@shared/ui/tooltip";

const mockUseInternalStaffEntitlement = vi.fn();

vi.mock("@features/billing", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/billing")>();
  return {
    ...actual,
    useInternalStaffEntitlement: () => mockUseInternalStaffEntitlement(),
  };
});

const mockGetSubscription = vi.fn();
const mockGetUsage = vi.fn();
const mockGetEntitlements = vi.fn();

vi.mock("@features/billing/infrastructure/billingApi", () => ({
  billingApi: {
    getSubscription: (...args: unknown[]) => mockGetSubscription(...args),
    getUsage: (...args: unknown[]) => mockGetUsage(...args),
    getEntitlements: (...args: unknown[]) => mockGetEntitlements(...args),
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

vi.mock("@features/vehicles/application", () => ({
  useVehicle: () => ({ data: undefined }),
}));

vi.mock("@features/employees", () => ({
  useEmployees: () => ({
    data: { data: [], pagination: { total: 0 } },
    isLoading: false,
  }),
}));

const MOCK_SUBSCRIPTION: BillingSubscription = {
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
  profitabilityLevel: "L0",
};

const MOCK_USAGE: BillingUsage = {
  tenantId: "tenant-1",
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
  history: [{ periodKey: "2026-06", stampsUsed: 90, overageStamps: 0 }],
};

const EMPTY_COMMERCIAL_SUMMARY = {
  planMonthlyPriceCents: 74900,
  modulesTotalCents: 0,
  overageTotalCents: 0,
  subtotalCents: 74900,
  ivaCents: 11984,
  estimatedTotalCents: 86884,
  currency: "MXN" as const,
  periodKey: "2026-07",
  billingCycle: "monthly",
};

const MOCK_ENTITLEMENTS_WITHOUT: BillingEntitlements = {
  directEntitlements: [],
  effectiveModuleCodes: [],
  profitabilityLevel: "L0",
  catalog: [],
  commercialSummary: EMPTY_COMMERCIAL_SUMMARY,
};

const MOCK_ENTITLEMENTS_WITH: BillingEntitlements = {
  directEntitlements: [
    {
      moduleCode: INTERNAL_STAFF_MODULE_CODE,
      moduleName: "Equipo de apoyo en viajes",
      kind: "addon",
      status: "active",
      activatedAt: "2026-07-01T12:00:00.000Z",
      priceLockedCents: 5900,
      priceTier: "ea",
      memberCodes: [],
    },
  ],
  effectiveModuleCodes: [INTERNAL_STAFF_MODULE_CODE],
  profitabilityLevel: "L0.5",
  catalog: [
    {
      code: INTERNAL_STAFF_MODULE_CODE,
      name: "Equipo de apoyo en viajes",
      kind: "addon",
      isActiveForTenant: true,
      memberCodes: [],
      priceEaCents: 5900,
      priceGaCents: 10900,
      maturity: "beta",
    },
  ],
  commercialSummary: {
    planMonthlyPriceCents: 74900,
    modulesTotalCents: 5900,
    overageTotalCents: 0,
    subtotalCents: 80800,
    ivaCents: 12928,
    estimatedTotalCents: 93728,
    currency: "MXN",
    periodKey: "2026-07",
    billingCycle: "monthly",
  },
};

function TestProviders({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={0}>
        <MemoryRouter>{children}</MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function BasicInfoStepHarness() {
  const form = useForm<TripWizardFormValues>({
    defaultValues: {
      ...defaultWizardFormValues,
      internalStaff: [],
    } as TripWizardFormValues,
  });

  return (
    <BasicInfoStep
      form={form}
      vehicles={[]}
      drivers={[]}
      fleetDrivers={[]}
      busyResources={{
        vehicleIds: new Set(),
        driverIds: new Set(),
        employeeIds: new Set(),
      }}
      clients={[]}
      isLoadingVehicles={false}
      isLoadingDrivers={false}
      isLoadingClients={false}
    />
  );
}

describe("billing workflow smoke (Imp-v1d)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSubscription.mockResolvedValue(MOCK_SUBSCRIPTION);
    mockGetUsage.mockResolvedValue(MOCK_USAGE);
    mockGetEntitlements.mockResolvedValue(MOCK_ENTITLEMENTS_WITHOUT);
    mockUseInternalStaffEntitlement.mockReturnValue({
      hasModule: false,
      isFetched: true,
      isLoading: false,
      data: MOCK_ENTITLEMENTS_WITHOUT,
    });
  });

  it("renders subscription page with plan, usage and modules", async () => {
    mockGetEntitlements.mockResolvedValue(MOCK_ENTITLEMENTS_WITH);

    render(
      <TestProviders>
        <BillingSubscriptionPage />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Operación Esencial").length).toBeGreaterThan(0);
    });

    expect(screen.getByText("Nivel de rentabilidad")).toBeInTheDocument();
    expect(screen.getByText("L0")).toBeInTheDocument();
    expect(screen.getAllByText(/45 de 120 timbres/).length).toBeGreaterThan(0);
    expect(screen.getByText("Equipo de apoyo en viajes")).toBeInTheDocument();
    expect(screen.getByText(billingCopy.metrics.estimatedTotal)).toBeInTheDocument();
    expect(screen.getAllByText(/\$937/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(billingCopy.commercial.title)).toBeInTheDocument();
    expect(screen.getByText("Early Access")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: billingCopy.contact.cta }),
    ).toHaveAttribute("href", "mailto:billing@boeltech.com");
  });

  it("shows paywall on support staff when entitlement is missing", async () => {
    render(
      <TestProviders>
        <BasicInfoStepHarness />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(screen.getByText(basicInfoCopy.paywall.title)).toBeInTheDocument();
    });

    expect(screen.getByText(basicInfoCopy.paywall.description)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: basicInfoCopy.paywall.cta }),
    ).toHaveAttribute("href", "/settings/subscription");

    const addButton = screen.getByRole("button", { name: basicInfoCopy.action.add });
    expect(addButton.closest(".pointer-events-none")).not.toBeNull();
  });

  it("enables support staff section when entitlement is active", async () => {
    mockUseInternalStaffEntitlement.mockReturnValue({
      hasModule: true,
      isFetched: true,
      isLoading: false,
      data: MOCK_ENTITLEMENTS_WITH,
    });

    render(
      <TestProviders>
        <BasicInfoStepHarness />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(basicInfoCopy.section.supportStaff),
      ).toBeInTheDocument();
    });

    expect(screen.queryByText(basicInfoCopy.paywall.title)).not.toBeInTheDocument();

    const addButton = screen.getByRole("button", { name: basicInfoCopy.action.add });
    expect(addButton.closest(".pointer-events-none")).toBeNull();
    await userEvent.click(addButton);
    expect(screen.getByText(basicInfoCopy.error.selectEmployee)).toBeInTheDocument();
  });
});
