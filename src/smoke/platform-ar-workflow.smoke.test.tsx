/**
 * Smoke ADR-0072 WS-B — Cobros: emitir → open → marcar pagado.
 * Mock de API; no requiere backend ni Playwright.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type {
  PlatformSaasArRow,
  PlatformSaasInvoiceDetail,
  PlatformUserJSON,
} from "@features/platform/domain/entities";
import { PlatformArLedgerPage } from "@features/platform/presentation/pages/PlatformArLedgerPage";
import { PlatformAuthProvider } from "@features/platform/presentation/providers/PlatformAuthProvider";
import {
  markPlatformFreshLoginSession,
  platformTokenStorage,
} from "@features/platform/infrastructure/platformTokenStorage";
import { platformCopy } from "@features/platform/presentation/copy/platformCopy";

const TENANT_ID = "tenant-ar-1";

const mockListAr = vi.fn();
const mockIssue = vi.fn();
const mockMarkPaid = vi.fn();
const mockGetReconciliation = vi.fn();

vi.mock("@features/platform/infrastructure/platformApi", () => ({
  platformApi: {
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
    getProfile: vi.fn(async () => ({
      id: "user-platform-ar",
      email: "platform@boeltech.com",
      firstName: "Platform",
      lastName: "Owner",
      platformRole: "platform_owner",
      scope: "platform",
      mfaEnabled: true,
      mfaEnabledAt: "2026-01-01T00:00:00.000Z",
    })),
    listAr: (...args: unknown[]) => mockListAr(...args),
    issueSaasInvoice: (...args: unknown[]) => mockIssue(...args),
    markSaasInvoicePaid: (...args: unknown[]) => mockMarkPaid(...args),
    getTenantReconciliationJson: (...args: unknown[]) =>
      mockGetReconciliation(...args),
    voidSaasInvoice: vi.fn(),
    listTenantSaasInvoices: vi.fn().mockResolvedValue([]),
    listTenants: vi.fn().mockResolvedValue({
      data: [
        {
          id: "tenant-ar-1",
          name: "AR Demo",
          subdomain: "ar-demo",
          status: "active",
          subscriptionStatus: "past_due",
          planCode: "operacion_crecimiento",
          planName: "Crecimiento",
          declaredFleetBand: null,
          declaredFleetUnits: null,
          userCount: 1,
          branchCount: 1,
          tripCount: 0,
          createdAt: "2026-01-01T00:00:00.000Z",
          suspendedAt: null,
        },
      ],
      pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
    }),
    getTenantById: vi.fn().mockResolvedValue({
      data: {
        id: "tenant-ar-1",
        name: "AR Demo",
        subdomain: "ar-demo",
        status: "active",
        subscriptionStatus: "past_due",
        planCode: "operacion_crecimiento",
        planName: "Crecimiento",
        declaredFleetBand: null,
        declaredFleetUnits: null,
        userCount: 1,
        branchCount: 1,
        tripCount: 0,
        createdAt: "2026-01-01T00:00:00.000Z",
        suspendedAt: null,
        usage: { userCount: 1, branchCount: 1, tripCount: 0 },
      },
    }),
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
  id: "user-platform-ar",
  email: "platform@boeltech.com",
  firstName: "Platform",
  lastName: "Owner",
  platformRole: "platform_owner",
  scope: "platform",
  mfaEnabled: true,
  mfaEnabledAt: "2026-01-01T00:00:00.000Z",
};

function baseInvoice(
  overrides: Partial<PlatformSaasArRow> = {},
): PlatformSaasArRow {
  return {
    id: "inv-ar-1",
    tenantId: TENANT_ID,
    subscriptionId: "sub-1",
    periodKey: "2026-07",
    periodStart: "2026-07-01T06:00:00.000Z",
    periodEnd: "2026-08-01T06:00:00.000Z",
    status: "open",
    currency: "MXN",
    planCode: "operacion_crecimiento",
    stampsIncluded: 380,
    stampsUsed: 390,
    stampsOverage: 10,
    subtotalCents: 160000,
    taxCents: 25600,
    totalCents: 185600,
    amountDueCents: 185600,
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
    tenantName: "AR Demo",
    subdomain: "ar-demo",
    subscriptionStatus: "past_due",
    ...overrides,
  };
}

function seedPlatformSession() {
  localStorage.clear();
  sessionStorage.clear();
  platformTokenStorage.setToken("smoke-platform-ar-token");
  platformTokenStorage.setRefreshToken("smoke-platform-ar-refresh");
  platformTokenStorage.setUser(PLATFORM_USER);
  markPlatformFreshLoginSession();
}

function renderAr(initialEntry = `/platform/billing/ar?tenant_id=${TENANT_ID}`) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <PlatformAuthProvider>
          <Routes>
            <Route path="/platform/billing/ar" element={<PlatformArLedgerPage />} />
          </Routes>
        </PlatformAuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("platform-ar-workflow smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedPlatformSession();
    mockListAr.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 25, total: 0, totalPages: 0 },
    });
    mockGetReconciliation.mockResolvedValue({
      tenantId: TENANT_ID,
      tenantName: "AR Demo",
      subdomain: "ar-demo",
      periodKey: "2026-07",
      planCode: "operacion_crecimiento",
      planName: "Crecimiento",
      monthlyPriceCents: 150000,
      billingCycle: "monthly",
      status: "past_due",
      includedStamps: 380,
      stampsUsed: 390,
      overageStamps: 10,
      overagePriceCents: 1000,
      overageTotalCents: 10000,
      activeModules: [],
      modulesTotalCents: 0,
      subtotalCents: 160000,
      ivaCents: 25600,
      totalCents: 185600,
    });
  });

  it("list empty → issue open → mark paid → paid", async () => {
    const user = userEvent.setup();
    const issued = baseInvoice({ status: "open" });
    const paid: PlatformSaasInvoiceDetail = {
      ...issued,
      status: "paid",
      amountDueCents: 0,
      amountPaidCents: 185600,
      paidAt: "2026-08-03T18:00:00.000Z",
      items: [],
      payments: [],
    };

    mockIssue.mockImplementation(async () => {
      mockListAr.mockResolvedValue({
        data: [issued],
        pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
      });
      return { ...issued, items: [], payments: [] };
    });

    mockMarkPaid.mockImplementation(async () => {
      mockListAr.mockResolvedValue({
        data: [
          baseInvoice({
            status: "paid",
            amountDueCents: 0,
            amountPaidCents: 185600,
            paidAt: paid.paidAt,
          }),
        ],
        pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
      });
      return paid;
    });

    renderAr();

    expect(
      await screen.findByText(platformCopy.ar.empty.title),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: platformCopy.ar.actions.issue }),
    );

    const issueDialog = await screen.findByRole("dialog");
    const periodInput = within(issueDialog).getByLabelText(
      platformCopy.ar.issue.periodKey,
    );
    await user.clear(periodInput);
    await user.type(periodInput, "2026-07");

    await waitFor(() => {
      expect(mockGetReconciliation).toHaveBeenCalledWith(TENANT_ID, "2026-07");
    });

    await user.click(
      within(issueDialog).getByRole("button", {
        name: platformCopy.ar.issue.submit,
      }),
    );

    await waitFor(() => {
      expect(mockIssue).toHaveBeenCalledWith(
        TENANT_ID,
        expect.objectContaining({
          periodKey: "2026-07",
          status: "open",
          dueDays: 14,
        }),
      );
    });

    expect(await screen.findByText("AR Demo")).toBeInTheDocument();
    expect(screen.getByText(platformCopy.ar.status.open)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: platformCopy.ar.actions.markPaid }),
    );

    const payDialog = await screen.findByRole("dialog");
    await user.click(
      within(payDialog).getByRole("button", {
        name: platformCopy.ar.markPaid.submit,
      }),
    );

    await waitFor(() => {
      expect(mockMarkPaid).toHaveBeenCalledWith(
        TENANT_ID,
        "inv-ar-1",
        expect.objectContaining({ method: "spei" }),
      );
    });

    expect(
      await screen.findByText(platformCopy.ar.status.paid),
    ).toBeInTheDocument();
  });
});
