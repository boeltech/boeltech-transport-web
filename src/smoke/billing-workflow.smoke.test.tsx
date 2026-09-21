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
import { PROFITABILITY_LEVEL_COPY } from "@features/billing/presentation/copy/profitabilityLevelCopy";
import { basicInfoCopy } from "@features/trips/presentation/copy/wizard/basicInfoCopy";
import type {
  BillingEntitlements,
  BillingSubscription,
  BillingUsage,
} from "@features/billing/domain/entities";
import { TooltipProvider } from "@shared/ui/tooltip";
import { PermissionProvider } from "@app/providers/PermissionProvider";

const mockGetAccess = vi.fn();
const mockGetSubscription = vi.fn();
const mockGetUsage = vi.fn();
const mockGetEntitlements = vi.fn();
const mockGetArrears = vi.fn();

vi.mock("@features/billing/infrastructure/billingApi", () => ({
  billingApi: {
    getAccess: (...args: unknown[]) => mockGetAccess(...args),
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
      moduleCode: "gps_tracking",
      moduleName: "Rastreo GPS en tiempo real",
      kind: "addon",
      status: "active",
      activatedAt: "2026-07-01T12:00:00.000Z",
      priceLockedCents: 14900,
      priceTier: "ea",
      memberCodes: [],
    },
  ],
  effectiveModuleCodes: ["gps_tracking"],
  profitabilityLevel: "L0",
  catalog: [
    {
      code: "gps_tracking",
      name: "Rastreo GPS en tiempo real",
      kind: "addon",
      isActiveForTenant: true,
      memberCodes: [],
      priceEaCents: 14900,
      priceGaCents: 27900,
      maturity: "beta",
    },
  ],
  commercialSummary: {
    planMonthlyPriceCents: 74900,
    modulesTotalCents: 14900,
    overageTotalCents: 0,
    subtotalCents: 89800,
    ivaCents: 14368,
    estimatedTotalCents: 104168,
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
      <PermissionProvider>
        <TooltipProvider delayDuration={0}>
          <MemoryRouter>{children}</MemoryRouter>
        </TooltipProvider>
      </PermissionProvider>
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
        vehicleConflicts: new Map(),
        driverConflicts: new Map(),
        employeeConflicts: new Map(),
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
    mockGetAccess.mockResolvedValue({
      subscriptionStatus: "active",
      isOperational: true,
      trialEndsAt: null,
      planName: "Operación Esencial",
      effectiveModuleCodes: [],
    });
    mockGetSubscription.mockResolvedValue(MOCK_SUBSCRIPTION);
    mockGetUsage.mockResolvedValue(MOCK_USAGE);
    mockGetEntitlements.mockResolvedValue(MOCK_ENTITLEMENTS_WITHOUT);
    mockGetArrears.mockResolvedValue({
      currency: "MXN",
      openCount: 0,
      totalOpenCents: 0,
      oldestDueDate: null,
      maxDaysOverdue: 0,
      invoices: [],
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

    // Nivel de rentabilidad: etiqueta comercial (sin código Lx en esta superficie).
    expect(screen.getByText(billingCopy.modules.level.label)).toBeInTheDocument();
    expect(screen.getByText("Margen operativo")).toBeInTheDocument();
    expect(
      screen.getByText(PROFITABILITY_LEVEL_COPY.L0.includes),
    ).toBeInTheDocument();

    expect(screen.getAllByText(/45 de 120 timbres usados/).length).toBeGreaterThan(0);
    expect(screen.getByText("Rastreo GPS en tiempo real")).toBeInTheDocument();
    expect(screen.getByText(billingCopy.costs.totalLabel)).toBeInTheDocument();
    expect(screen.getAllByText(/\$1,041|\$1041/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(billingCopy.costs.title)).toBeInTheDocument();
    expect(screen.getByText(billingCopy.modules.eaBadge)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: billingCopy.modules.level.profitabilityLink }),
    ).toHaveAttribute("href", "/finance/analysis?view=margin");
    expect(
      screen.getByRole("link", { name: billingCopy.contact.cta }),
    ).toHaveAttribute("href", "mailto:billing@boeltech.com");

    // El precio del plan aparece una sola vez: ya no se duplica en KPIs (D3).
    expect(screen.getAllByText("$749.00")).toHaveLength(1);
  });

  it("renders SoT v5 motriz semantics (piloto 14 × $319)", async () => {
    mockGetSubscription.mockResolvedValue({
      ...MOCK_SUBSCRIPTION,
      planCode: "operacion_pequena",
      planName: "Operación Pequeña",
      monthlyPriceCents: 0,
      includedStamps: 420,
      stampsUsedThisPeriod: 12,
      pricePerMotrizCents: 31900,
      stampsPerMotriz: 30,
      bandQMin: 6,
      bandQMax: 30,
      overagePriceCents: 500,
      qFact: 14,
    });
    mockGetUsage.mockResolvedValue({
      ...MOCK_USAGE,
      planCode: "operacion_pequena",
      includedStamps: 420,
      stampsUsed: 12,
      overageStamps: 0,
      overagePriceCents: 500,
      overageTotalCents: 0,
    });
    mockGetEntitlements.mockResolvedValue({
      ...MOCK_ENTITLEMENTS_WITHOUT,
      // API SoT F3b: cargo plan = Q×P (14×31900), IVA 16% en summary
      commercialSummary: {
        ...EMPTY_COMMERCIAL_SUMMARY,
        planMonthlyPriceCents: 446600,
        modulesTotalCents: 0,
        overageTotalCents: 0,
        subtotalCents: 446600,
        ivaCents: 71456,
        estimatedTotalCents: 518056,
      },
    });
    mockGetAccess.mockResolvedValue({
      subscriptionStatus: "active",
      isOperational: true,
      trialEndsAt: null,
      planName: "Operación Pequeña",
      effectiveModuleCodes: [],
    });

    render(
      <TestProviders>
        <BillingSubscriptionPage />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Operación Pequeña").length).toBeGreaterThan(0);
    });

    expect(
      screen.getAllByText(billingCopy.plan.bandLabels.pequena).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/\$319\.00 \/ motriz \/ mes/)).toBeInTheDocument();
    expect(screen.getByText(/14 motrizes este periodo/)).toBeInTheDocument();
    expect(screen.getByText(/420 timbres \(30 × 14\)/)).toBeInTheDocument();
    expect(screen.getByText(billingCopy.stamps.title)).toBeInTheDocument();
    expect(screen.getByText(/Bolsa = 30 × 14 motrizes/)).toBeInTheDocument();
    expect(screen.getByText(billingCopy.costs.rows.motrizCargo)).toBeInTheDocument();
    expect(screen.getByText(billingCopy.plan.noFeeNote)).toBeInTheDocument();
    // Cargo plan 14×319 = $4,466 desde summary API; estimado + IVA = $5,180.56
    expect(screen.getAllByText(/\$4,466\.00/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/\$5,180\.56/)).toBeInTheDocument();
  });

  /** DoD piloto CEO (F4): Q=4 Micro · 4×$389=$1,556 · bolsa 120 · total c/IVA ~$1,804.96 */
  it("renders SoT v5 motriz semantics (piloto CEO 4 × $389)", async () => {
    mockGetSubscription.mockResolvedValue({
      ...MOCK_SUBSCRIPTION,
      planCode: "operacion_micro",
      planName: "Operación Micro",
      monthlyPriceCents: 0,
      includedStamps: 120,
      stampsUsedThisPeriod: 8,
      pricePerMotrizCents: 38900,
      stampsPerMotriz: 30,
      bandQMin: 1,
      bandQMax: 5,
      overagePriceCents: 600,
      qFact: 4,
    });
    mockGetUsage.mockResolvedValue({
      ...MOCK_USAGE,
      planCode: "operacion_micro",
      includedStamps: 120,
      stampsUsed: 8,
      overageStamps: 0,
      overagePriceCents: 600,
      overageTotalCents: 0,
    });
    mockGetEntitlements.mockResolvedValue({
      ...MOCK_ENTITLEMENTS_WITHOUT,
      commercialSummary: {
        ...EMPTY_COMMERCIAL_SUMMARY,
        planMonthlyPriceCents: 155600,
        modulesTotalCents: 0,
        overageTotalCents: 0,
        subtotalCents: 155600,
        ivaCents: 24896,
        estimatedTotalCents: 180496,
      },
    });
    mockGetAccess.mockResolvedValue({
      subscriptionStatus: "active",
      isOperational: true,
      trialEndsAt: null,
      planName: "Operación Micro",
      effectiveModuleCodes: [],
    });

    render(
      <TestProviders>
        <BillingSubscriptionPage />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Operación Micro").length).toBeGreaterThan(0);
    });

    expect(
      screen.getAllByText(billingCopy.plan.bandLabels.micro).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/\$389\.00 \/ motriz \/ mes/)).toBeInTheDocument();
    expect(screen.getByText(/4 motrizes este periodo/)).toBeInTheDocument();
    expect(screen.getByText(/120 timbres \(30 × 4\)/)).toBeInTheDocument();
    expect(screen.getByText(/Bolsa = 30 × 4 motrizes/)).toBeInTheDocument();
    expect(screen.getByText(billingCopy.costs.rows.motrizCargo)).toBeInTheDocument();
    // Cargo 4×389 = $1,556; estimado + IVA = $1,804.96
    expect(screen.getAllByText(/\$1,556\.00/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/\$1,804\.96/)).toBeInTheDocument();
  });

  it("shows a single notice when stamps run out (D5)", async () => {
    mockGetUsage.mockResolvedValue({
      ...MOCK_USAGE,
      stampsUsed: 120,
      overageStamps: 4,
      overageTotalCents: 2400,
    });

    render(
      <TestProviders>
        <BillingSubscriptionPage />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(billingCopy.notices.stampsExhausted.title),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByText(billingCopy.notices.stampsLow.title),
    ).not.toBeInTheDocument();
    expect(screen.getByText(billingCopy.stamps.overageTitle)).toBeInTheDocument();
  });

  it("renders support staff section natively without paywall in basic info step", async () => {
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

    const addButton = screen.getByRole("button", { name: basicInfoCopy.action.add });
    expect(addButton.closest(".pointer-events-none")).toBeNull();
    await userEvent.click(addButton);
    expect(screen.getByText(basicInfoCopy.error.selectEmployee)).toBeInTheDocument();
  });
});
