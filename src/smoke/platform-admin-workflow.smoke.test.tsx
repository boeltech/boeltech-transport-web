/**
 * Smoke ADR-0062 + ADR-0097 — consola plataforma (Pulso → empresas → suspender).
 * Mock de API; no requiere backend ni Playwright.
 *
 * ADR-0097 F1b: landing Pulso (GET /platform/pulse), health/stage en lista,
 * detalle con tabs Resumen | Comercial | Operación | Actividad.
 *
 * SoT v5 (Fase 4): detalle monta TenantThisMonthCard con suscripción motriz
 * (Q=14 × P=31900¢ = 446600¢) + capacity ADR-0095 (OVER_LIMIT observable).
 * Activate / AR smokes no ejercitan el hero de precio; este es el camino de evidencia.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { BillingCapacity } from "@features/billing";
import type {
  PlatformBillingPlan,
  PlatformMetrics,
  PlatformPulse,
  PlatformTenantDetail,
  PlatformTenantListItem,
  PlatformTenantStampUsage,
  PlatformTenantSubscription,
  PlatformUserJSON,
} from "@features/platform/domain/entities";
import { PlatformDashboardPage } from "@features/platform/presentation/pages/PlatformDashboardPage";
import { PlatformTenantsListPage } from "@features/platform/presentation/pages/PlatformTenantsListPage";
import { PlatformTenantDetailPage } from "@features/platform/presentation/pages/PlatformTenantDetailPage";
import { PlatformAuthProvider } from "@features/platform/presentation/providers/PlatformAuthProvider";
import {
  markPlatformFreshLoginSession,
  platformTokenStorage,
} from "@features/platform/infrastructure/platformTokenStorage";
import { platformCopy } from "@features/platform/presentation/copy/platformCopy";
import { formatBillingPriceCents } from "@features/platform/presentation/utils/platformBillingFormatters";
import { emptyPlatformTenantHealth } from "@features/platform/infrastructure/mappers";

const TENANT_ID = "tenant-smoke-1";

/** Piloto SoT v5: 14 × $319.00 = $4,466.00 */
const MOTRIZ_Q = 14;
const MOTRIZ_P_CENTS = 31900;
const MOTRIZ_CARGO_CENTS = MOTRIZ_Q * MOTRIZ_P_CENTS; // 446600
const MODULES_CENTS = 5900;
const SUBTOTAL_CENTS = MOTRIZ_CARGO_CENTS + MODULES_CENTS; // 452500
const IVA_CENTS = Math.round(SUBTOTAL_CENTS * 0.16); // 72400
const ESTIMATED_TOTAL_CENTS = SUBTOTAL_CENTS + IVA_CENTS; // 524900

const mockGetMetrics = vi.fn();
const mockGetPulse = vi.fn();
const mockListTenants = vi.fn();
const mockGetTenantById = vi.fn();
const mockUpdateTenantStatus = vi.fn();
const mockListPlans = vi.fn();
const mockGetTenantEntitlements = vi.fn();
const mockGetTenantSubscription = vi.fn();
const mockGetTenantStampUsage = vi.fn();
const mockListTenantSaasInvoices = vi.fn();
const mockListAuditLog = vi.fn();

vi.mock("@features/platform/infrastructure/platformApi", () => ({
  platformApi: {
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
    getProfile: vi.fn(async () => ({
      id: "user-platform-smoke",
      email: "platform@boeltech.com",
      firstName: "Platform",
      lastName: "Owner",
      platformRole: "platform_owner",
      scope: "platform",
      mfaEnabled: true,
      mfaEnabledAt: "2026-01-01T00:00:00.000Z",
    })),
    getMetrics: (...args: unknown[]) => mockGetMetrics(...args),
    getPulse: (...args: unknown[]) => mockGetPulse(...args),
    listPlans: (...args: unknown[]) => mockListPlans(...args),
    listTenants: (...args: unknown[]) => mockListTenants(...args),
    getTenantById: (...args: unknown[]) => mockGetTenantById(...args),
    createTenant: vi.fn(),
    updateTenantStatus: (...args: unknown[]) => mockUpdateTenantStatus(...args),
    getTenantEntitlements: (...args: unknown[]) =>
      mockGetTenantEntitlements(...args),
    getTenantSubscription: (...args: unknown[]) =>
      mockGetTenantSubscription(...args),
    getTenantStampUsage: (...args: unknown[]) =>
      mockGetTenantStampUsage(...args),
    listTenantSaasInvoices: (...args: unknown[]) =>
      mockListTenantSaasInvoices(...args),
    listAuditLog: (...args: unknown[]) => mockListAuditLog(...args),
  },
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
  };
});

const PLATFORM_USER: PlatformUserJSON = {
  id: "user-platform-smoke",
  email: "platform@boeltech.com",
  firstName: "Platform",
  lastName: "Owner",
  platformRole: "platform_owner",
  scope: "platform",
  mfaEnabled: true,
  mfaEnabledAt: "2026-01-01T00:00:00.000Z",
};

const MOTRIZ_PLAN: PlatformBillingPlan = {
  code: "operacion_pequena",
  name: "Operación Pequeña",
  maxUsers: 10,
  maxBranches: 3,
  historyMonths: 12,
  isActive: true,
  monthlyPriceCents: 0,
  annualPriceCents: null,
  includedStamps: 420,
  overagePriceCents: 500,
  quotaPolicy: "soft_cap",
  features: {},
  pricePerMotrizCents: MOTRIZ_P_CENTS,
  stampsPerMotriz: 30,
  bandQMin: 6,
  bandQMax: 30,
};

const CRECIMIENTO_PLAN: PlatformBillingPlan = {
  code: "operacion_crecimiento",
  name: "Operación Crecimiento",
  maxUsers: 25,
  maxBranches: 8,
  historyMonths: 24,
  isActive: true,
  monthlyPriceCents: 0,
  annualPriceCents: null,
  includedStamps: 900,
  overagePriceCents: 500,
  quotaPolicy: "soft_cap",
  features: {},
  pricePerMotrizCents: 28900,
  stampsPerMotriz: 30,
  bandQMin: 31,
  bandQMax: 80,
};

function withinCapacity(
  overrides: Partial<BillingCapacity> = {},
): BillingCapacity {
  return {
    bandCode: "operacion_pequena",
    pendingBandCode: null,
    users: {
      granted: 5,
      usage: 8,
      limitReached: true,
      overQuota: true,
      overQuotaCount: 3,
      status: "over_limit",
    },
    branches: {
      granted: 3,
      usage: 1,
      limitReached: false,
      overQuota: false,
      overQuotaCount: 0,
      status: "within_limit",
    },
    historyMonths: { granted: 12 },
    ...overrides,
  };
}

function createMotrizSubscription(
  overrides: Partial<PlatformTenantSubscription> = {},
): PlatformTenantSubscription {
  return {
    planCode: "operacion_pequena",
    planName: "Operación Pequeña",
    status: "active",
    billingCycle: "monthly",
    monthlyPriceCents: 0,
    includedStamps: 420,
    stampsUsedThisPeriod: 12,
    quotaPolicy: "soft_cap",
    currentPeriodStart: "2026-07-01T06:00:00.000Z",
    currentPeriodEnd: "2026-08-01T06:00:00.000Z",
    trialEndsAt: null,
    notes: null,
    limits: {
      maxUsers: 5,
      maxBranches: 3,
      historyMonths: 12,
    },
    capacityBandCode: "operacion_pequena",
    pendingCapacityBandCode: null,
    capacity: withinCapacity(),
    profitabilityLevel: "L1",
    pricePerMotrizCents: MOTRIZ_P_CENTS,
    stampsPerMotriz: 30,
    bandQMin: 6,
    bandQMax: 30,
    overagePriceCents: 500,
    qFact: MOTRIZ_Q,
    ...overrides,
  };
}

function createStampUsage(): PlatformTenantStampUsage {
  return {
    tenantId: TENANT_ID,
    planCode: "operacion_pequena",
    periodKey: "2026-07",
    includedStamps: 420,
    stampsUsed: 12,
    overageStamps: 0,
    overageTotalCents: 0,
    quotaPolicy: "soft_cap",
    prepaidRemaining: 0,
    prepaidConsumed: 0,
  };
}

function createActiveTenant(): PlatformTenantDetail {
  return {
    id: TENANT_ID,
    name: "Transporte Demo",
    subdomain: "demo-transporte",
    status: "active",
    subscriptionStatus: "active",
    planCode: "operacion_pequena",
    planName: "Operación Pequeña",
    declaredFleetBand: null,
    declaredFleetUnits: null,
    userCount: 8,
    branchCount: 1,
    tripCount: 12,
    createdAt: "2026-06-01T10:00:00.000Z",
    suspendedAt: null,
    healthScore: 72,
    lifecycleStage: "active",
    healthAsOf: "2026-09-21T12:00:00.000Z",
    usage: { userCount: 8, branchCount: 1, tripCount: 12 },
    adminActivation: {
      status: "activated",
      email: "admin@demo.mx",
      expiresAt: null,
      lastSentAt: "2026-06-01T10:00:00.000Z",
      lastSendError: null,
      sendAttempts: 1,
    },
    health: {
      score: 72,
      asOf: "2026-09-21T12:00:00.000Z",
      signals: {
        fiscal: 80,
        payment: 75,
        adoption: 60,
        fleet: 70,
        engagement: 65,
      },
      weights: emptyPlatformTenantHealth().weights,
    },
  };
}

function createMetrics(): PlatformMetrics {
  return {
    totalTenants: 4,
    activeTenants: 3,
    suspendedTenants: 1,
    tenantsByPlan: {
      operacion_pequena: 2,
      operacion_crecimiento: 1,
    },
    totalUsers: 18,
    tenantsCreatedLast30Days: 1,
  };
}

function createPulse(): PlatformPulse {
  return {
    generatedAt: "2026-09-21T12:00:00.000Z",
    healthAsOf: "2026-09-21T11:55:00.000Z",
    kpis: {
      mrrCents: 1_250_000,
      currency: "MXN",
      cxcOverdueCents: 50_000,
      tenantsAtRisk: 1,
      trialsActive: 2,
      stampsIssuedMtd: 40,
      motricesAdministered: 14,
      nrrPct: null,
      trialToPaidPct30d: null,
    },
    attentionQueue: [
      {
        tenantId: TENANT_ID,
        name: "Transporte Demo",
        subdomain: "demo-transporte",
        lifecycleStage: "at_risk",
        healthScore: 32,
        reasonCodes: ["health_below_threshold", "cxc_overdue"],
        cxcOverdueCents: 50_000,
        subscriptionStatus: "past_due",
        accessStatus: "active",
      },
    ],
  };
}

function seedPlatformSession() {
  localStorage.clear();
  sessionStorage.clear();
  platformTokenStorage.setToken("smoke-platform-token");
  platformTokenStorage.setRefreshToken("smoke-platform-refresh");
  platformTokenStorage.setUser(PLATFORM_USER);
  markPlatformFreshLoginSession();
}

function renderPlatform(
  ui: ReactNode,
  initialEntry = "/platform",
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <PlatformAuthProvider>{ui}</PlatformAuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("smoke platform admin workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedPlatformSession();

    mockListPlans.mockResolvedValue([MOTRIZ_PLAN, CRECIMIENTO_PLAN]);
    mockGetMetrics.mockResolvedValue(createMetrics());
    mockGetPulse.mockResolvedValue(createPulse());
    mockListAuditLog.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
    mockGetTenantSubscription.mockResolvedValue(createMotrizSubscription());
    mockGetTenantStampUsage.mockResolvedValue(createStampUsage());
    mockListTenantSaasInvoices.mockResolvedValue([]);

    mockGetTenantEntitlements.mockResolvedValue({
      directEntitlements: [
        {
          moduleCode: "gps_tracking",
          moduleName: "Rastreo GPS en tiempo real",
          kind: "addon",
          status: "active",
          activatedAt: "2026-07-01T12:00:00.000Z",
          priceLockedCents: MODULES_CENTS,
          priceTier: "ea",
          memberCodes: [],
        },
      ],
      effectiveModuleCodes: ["gps_tracking"],
      profitabilityLevel: "L1",
      catalog: [],
      commercialSummary: {
        planMonthlyPriceCents: MOTRIZ_CARGO_CENTS,
        modulesTotalCents: MODULES_CENTS,
        overageTotalCents: 0,
        subtotalCents: SUBTOTAL_CENTS,
        ivaCents: IVA_CENTS,
        estimatedTotalCents: ESTIMATED_TOTAL_CENTS,
        currency: "MXN",
        periodKey: "2026-07",
        billingCycle: "monthly",
      },
    });
  });

  it("renders Pulso KPIs and attention queue from platform pulse", async () => {
    renderPlatform(<PlatformDashboardPage />);

    expect(
      await screen.findByText(platformCopy.pulse.title),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(mockGetPulse).toHaveBeenCalled();
    });

    expect(screen.getByText(platformCopy.pulse.kpis.mrr)).toBeInTheDocument();
    expect(
      screen.getByText(formatBillingPriceCents(1_250_000)),
    ).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(
      screen.getByText(platformCopy.pulse.queue.title),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Transporte Demo").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        platformCopy.pulse.reasonCodes.health_below_threshold,
      ).length,
    ).toBeGreaterThan(0);
  });

  it("lists tenants with health score and lifecycle stage", async () => {
    const tenant = createActiveTenant();
    mockListTenants.mockResolvedValue({
      data: [tenant as PlatformTenantListItem],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    renderPlatform(<PlatformTenantsListPage />, "/platform/tenants");

    expect(
      (await screen.findAllByText("Transporte Demo")).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("72").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(platformCopy.lifecycle.labels.active).length,
    ).toBeGreaterThan(0);
  });

  it("lists null health_score as em dash (R1)", async () => {
    const tenant = {
      ...createActiveTenant(),
      healthScore: null,
      healthAsOf: null,
    };
    mockListTenants.mockResolvedValue({
      data: [tenant as PlatformTenantListItem],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    renderPlatform(<PlatformTenantsListPage />, "/platform/tenants");

    expect(
      (await screen.findAllByText("Transporte Demo")).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(platformCopy.health.nullLabel).length,
    ).toBeGreaterThan(0);
  });

  it("lists tenants, opens detail with SoT v5 Q×P + OVER_LIMIT, and suspends", async () => {
    const user = userEvent.setup();
    let tenantState = createActiveTenant();

    mockListTenants.mockImplementation(async () => ({
      data: [tenantState as PlatformTenantListItem],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    }));

    mockGetTenantById.mockImplementation(async () => ({
      data: tenantState,
      message: undefined,
    }));

    mockUpdateTenantStatus.mockImplementation(async (_id, payload) => {
      tenantState = {
        ...tenantState,
        status: payload.status,
        suspendedAt:
          payload.status === "suspended"
            ? "2026-07-04T16:00:00.000Z"
            : null,
      };
      return {
        data: tenantState as PlatformTenantListItem,
        message: "Estado actualizado",
      };
    });

    renderPlatform(
      <Routes>
        <Route path="/platform/tenants" element={<PlatformTenantsListPage />} />
        <Route
          path="/platform/tenants/:id"
          element={<PlatformTenantDetailPage />}
        />
      </Routes>,
      "/platform/tenants",
    );

    const tenantNameMatches = await screen.findAllByText("Transporte Demo");
    expect(tenantNameMatches.length).toBeGreaterThan(0);
    expect(screen.getAllByText("demo-transporte").length).toBeGreaterThan(0);

    await user.click(tenantNameMatches[0]);

    expect(
      await screen.findByRole("heading", { name: "Transporte Demo" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(platformCopy.tenants.detail.sections.thisMonth),
    ).toBeInTheDocument();

    // SoT v5 evidencia: cargo Q×P en hero de «Este mes» (no flat $749).
    expect(
      await screen.findByText(formatBillingPriceCents(MOTRIZ_CARGO_CENTS)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        platformCopy.tenants.detail.planPrice.cargoHint(
          formatBillingPriceCents(MOTRIZ_P_CENTS),
          MOTRIZ_Q,
        ),
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(formatBillingPriceCents(74900))).toBeNull();

    // Capacity ADR-0095: usage/granted + OVER_LIMIT en card Operación.
    expect(
      await screen.findByText(
        platformCopy.tenants.detail.sections.capacitySummary(8, 1, {
          users: 5,
          branches: 3,
        }),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(platformCopy.tenants.detail.subscription.overLimitHint),
    ).toBeInTheDocument();

    // Estimado comercial coherente con Q×P (no $937 de flat v3).
    expect(
      screen.getAllByText(formatBillingPriceCents(ESTIMATED_TOTAL_CENTS))
        .length,
    ).toBeGreaterThan(0);

    await user.click(
      screen.getByRole("button", {
        name: platformCopy.tenants.detail.sections.breakdownShow,
      }),
    );
    expect(
      await screen.findByText("Rastreo GPS en tiempo real"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: platformCopy.tenants.detail.actions.moreActions,
      }),
    );
    await user.click(
      await screen.findByRole("menuitem", {
        name: platformCopy.tenants.detail.actions.suspend,
      }),
    );

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByRole("heading", {
        name: platformCopy.tenants.suspend.suspendTitle,
      }),
    ).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("button", {
        name: platformCopy.tenants.suspend.confirmSuspend,
      }),
    );

    await waitFor(() => {
      expect(mockUpdateTenantStatus).toHaveBeenCalledWith(TENANT_ID, {
        status: "suspended",
        reason: "",
      });
    });

    await waitFor(async () => {
      await user.click(
        screen.getByRole("button", {
          name: platformCopy.tenants.detail.actions.moreActions,
        }),
      );
      expect(
        screen.getByRole("menuitem", {
          name: platformCopy.tenants.detail.actions.reactivate,
        }),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("menuitem", {
        name: platformCopy.tenants.detail.actions.suspend,
      }),
    ).not.toBeInTheDocument();
  });

  it("cancelled tenant menu shows reactivate only (no suspend/cancel)", async () => {
    const user = userEvent.setup();
    const cancelled = {
      ...createActiveTenant(),
      status: "cancelled" as const,
      suspendedAt: null,
    };

    mockListTenants.mockResolvedValue({
      data: [cancelled as PlatformTenantListItem],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    mockGetTenantById.mockResolvedValue({
      data: cancelled,
      message: undefined,
    });

    renderPlatform(
      <Routes>
        <Route
          path="/platform/tenants/:id"
          element={<PlatformTenantDetailPage />}
        />
      </Routes>,
      `/platform/tenants/${TENANT_ID}`,
    );

    expect(
      await screen.findByRole("heading", { name: "Transporte Demo" }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: platformCopy.tenants.detail.actions.moreActions,
      }),
    );

    expect(
      screen.getByRole("menuitem", {
        name: platformCopy.tenants.detail.actions.reactivate,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", {
        name: platformCopy.tenants.detail.actions.suspend,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", {
        name: platformCopy.tenants.detail.actions.cancel,
      }),
    ).not.toBeInTheDocument();
  });
});
