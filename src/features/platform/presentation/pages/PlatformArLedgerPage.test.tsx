import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { PlatformSaasArRow } from "../../domain/entities";
import { platformCopy } from "../copy/platformCopy";
import { formatBillingPeriodKey } from "../utils/platformBillingFormatters";
import { formatDate } from "@shared/utils/dateUtils";
import { PlatformArLedgerPage } from "./PlatformArLedgerPage";

const {
  mockUsePlatformArList,
  mockUsePlatformArViewCounts,
  mockUsePlatformArCloseRun,
  mockUsePlatformArChargeRun,
  mockUseIssueSaasInvoiceDraft,
  mockUsePlatformAuth,
} = vi.hoisted(() => ({
  mockUsePlatformArList: vi.fn(),
  mockUsePlatformArViewCounts: vi.fn(),
  mockUsePlatformArCloseRun: vi.fn(),
  mockUsePlatformArChargeRun: vi.fn(),
  mockUseIssueSaasInvoiceDraft: vi.fn(),
  mockUsePlatformAuth: vi.fn(),
}));

vi.mock("../../application/hooks/usePlatformSaasAr", () => ({
  usePlatformArList: (...args: unknown[]) => mockUsePlatformArList(...args),
  usePlatformArViewCounts: (...args: unknown[]) =>
    mockUsePlatformArViewCounts(...args),
  usePlatformArCloseRun: (...args: unknown[]) =>
    mockUsePlatformArCloseRun(...args),
  usePlatformArChargeRun: (...args: unknown[]) =>
    mockUsePlatformArChargeRun(...args),
  useIssueSaasInvoiceDraft: (...args: unknown[]) =>
    mockUseIssueSaasInvoiceDraft(...args),
}));

vi.mock("../providers/PlatformAuthProvider", () => ({
  usePlatformAuth: (...args: unknown[]) => mockUsePlatformAuth(...args),
}));

vi.mock("@features/billing", () => ({
  isStripePublishableConfigured: () => false,
}));

vi.mock("../components/ArTenantFilter", () => ({
  ArTenantFilter: () => <div>tenant-filter</div>,
}));

vi.mock("../components/IssueSaasInvoiceSheet", () => ({
  IssueSaasInvoiceSheet: () => null,
}));
vi.mock("../components/MarkSaasInvoicePaidSheet", () => ({
  MarkSaasInvoicePaidSheet: () => null,
}));
vi.mock("../components/ChargeSaasInvoiceStripeSheet", () => ({
  ChargeSaasInvoiceStripeSheet: () => null,
}));
vi.mock("../components/VoidSaasInvoiceDialog", () => ({
  VoidSaasInvoiceDialog: () => null,
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...mod,
    useToast: () => ({ toast: vi.fn() }),
  };
});

function buildRow(overrides: Partial<PlatformSaasArRow> = {}): PlatformSaasArRow {
  return {
    id: "inv-1",
    tenantId: "tenant-1",
    tenantName: "Transportes Norte",
    subdomain: "norte",
    subscriptionStatus: "active",
    subscriptionId: "sub-1",
    periodKey: "2026-07",
    periodStart: "2026-07-01T06:00:00.000Z",
    periodEnd: "2026-08-01T06:00:00.000Z",
    status: "open",
    currency: "MXN",
    planCode: "operacion_crecimiento",
    stampsIncluded: 380,
    stampsUsed: 400,
    stampsOverage: 20,
    subtotalCents: 170000,
    taxCents: 27200,
    totalCents: 197200,
    amountDueCents: 197200,
    amountPaidCents: 0,
    issuedAt: "2026-08-01T16:00:00.000Z",
    dueDate: "2026-08-15T16:00:00.000Z",
    paidAt: null,
    voidedAt: null,
    voidReason: null,
    notes: null,
    daysOverdue: 3,
    origin: "manual",
    createdAt: "2026-08-01T16:00:00.000Z",
    updatedAt: "2026-08-01T16:00:00.000Z",
    ...overrides,
  };
}

function closeRunResult(overrides: {
  ran?: boolean;
  actionable?: number;
  items?: Array<{
    tenantId: string;
    tenantName: string;
    subdomain: string;
    skipReason:
      | "VOID_HOLD"
      | "NO_CUT"
      | "SUB_NOT_ELIGIBLE"
      | "CUT_NO_FLEET";
    skipGroup: "actionable" | "policy";
    canIssueOverride?: boolean;
    hasFrozenAmount?: boolean;
  }>;
} = {}) {
  const items = (overrides.items ?? []).map((item) => ({
    tenantId: item.tenantId,
    tenantName: item.tenantName,
    subdomain: item.subdomain,
    skipReason: item.skipReason,
    skipGroup: item.skipGroup,
    subscriptionStatus: "active",
    cutStatus: item.skipReason === "CUT_NO_FLEET" ? "skipped_no_band" : "draft",
    estimatedTotalCents: 174000,
    hasFrozenAmount: item.hasFrozenAmount ?? true,
    canIssueOverride: item.canIssueOverride ?? true,
    existingVoidInvoiceId: item.skipReason === "VOID_HOLD" ? "inv-void" : null,
    nonVoidInvoiceId: null,
  }));
  return {
    data: {
      data: {
        periodKey: "2026-07",
        run: {
          ran: overrides.ran ?? true,
          ranAt: "2026-08-01T06:05:00.000Z",
          issuedCount: 12,
          consideredCount: 14,
          errorsCount: 0,
        },
        counts: {
          actionable: overrides.actionable ?? items.length,
          policy: 0,
        },
        items,
      },
      pagination: {
        page: 1,
        limit: 25,
        total: items.length,
        totalPages: 1,
      },
    },
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch: vi.fn(),
  };
}

function chargeRunResult(overrides: {
  ran?: boolean;
  charged?: number;
  noPaymentMethod?: number;
  failed?: number;
  requiresAction?: number;
  processing?: number;
  latestAttempts?: Array<{
    saasInvoiceId: string;
    outcome: "charged" | "failed" | "requires_action" | "processing";
  }>;
  items?: Array<{
    tenantId: string;
    tenantName: string;
    saasInvoiceId: string;
    skipReason: string | null;
    outcome?: "skipped" | "failed";
  }>;
} = {}) {
  return {
    data: {
      data: {
        run: {
          ran: overrides.ran ?? true,
          id: "run-1",
          ranAt: "2026-09-23T12:05:00.000Z",
          trigger: "job_tick",
          considered: 12,
          charged: overrides.charged ?? 8,
          errors: 0,
        },
        counts: {
          charged: overrides.charged ?? 8,
          noPaymentMethod: overrides.noPaymentMethod ?? 0,
          failed: overrides.failed ?? 0,
          requiresAction: overrides.requiresAction ?? 0,
          processing: overrides.processing ?? 0,
          skippedOther: 0,
        },
        items: (overrides.items ?? []).map((row) => ({
          tenantId: row.tenantId,
          tenantName: row.tenantName,
          subdomain: "demo",
          saasInvoiceId: row.saasInvoiceId,
          periodKey: "2026-08",
          outcome: row.outcome ?? "skipped",
          skipReason: row.skipReason,
          failureCode: null,
          gatewayPaymentId: null,
          createdAt: "2026-09-23T12:05:00.000Z",
        })),
        latestAttempts: (overrides.latestAttempts ?? []).map((row) => ({
          saasInvoiceId: row.saasInvoiceId,
          outcome: row.outcome,
          skipReason: null,
          failureCode: row.outcome === "failed" ? "card_declined" : null,
          createdAt: "2026-09-23T12:05:00.000Z",
        })),
      },
      pagination: { page: 1, limit: 25, total: 0, totalPages: 0 },
    },
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch: vi.fn(),
  };
}

function authUser(role: "platform_owner" | "platform_support") {
  return {
    user: {
      id: "u1",
      email: "ops@test.com",
      firstName: "Ops",
      lastName: "Test",
      platformRole: role,
      scope: "platform" as const,
    },
    token: "at",
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
  };
}

function renderPage(
  initialUrl = "/platform/billing/ar?status=open",
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialUrl]}>
        <PlatformArLedgerPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("PlatformArLedgerPage P2 polish", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePlatformAuth.mockReturnValue(authUser("platform_owner"));
    mockUseIssueSaasInvoiceDraft.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    mockUsePlatformArViewCounts.mockReturnValue({
      pending: 4,
      overdue: 1,
      all: 9,
      refetch: vi.fn(),
    });
    mockUsePlatformArList.mockReturnValue({
      data: {
        data: [buildRow()],
        pagination: { page: 1, limit: 25, total: 4, totalPages: 1 },
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    });
    mockUsePlatformArCloseRun.mockReturnValue(closeRunResult({ actionable: 0 }));
    mockUsePlatformArChargeRun.mockReturnValue(chargeRunResult({ ran: false }));
  });

  it("shows period, status, due date and overdue on the mobile card", () => {
    renderPage();

    const card = screen.getByRole("list").querySelector("li");
    expect(card).toBeTruthy();
    const mobile = within(card as HTMLElement);

    expect(
      mobile.getByText(formatBillingPeriodKey("2026-07")),
    ).toBeInTheDocument();
    expect(mobile.getByText(platformCopy.ar.status.open)).toBeInTheDocument();
    expect(
      mobile.getByText(formatDate("2026-08-15T16:00:00.000Z")),
    ).toBeInTheDocument();
    expect(
      mobile.getByText(platformCopy.ar.card.daysOverdue(3)),
    ).toBeInTheDocument();
  });

  it("paints distinct counts on view chips and forwards period/tenant filters", () => {
    renderPage(
      "/platform/billing/ar?status=open&period_key=2026-07&tenant_id=tenant-1",
    );

    expect(mockUsePlatformArViewCounts).toHaveBeenCalledWith({
      periodKey: "2026-07",
      tenantId: "tenant-1",
    });

    const copy = platformCopy.ar.views;
    expect(
      screen.getByRole("button", { name: copy.chipAria(copy.pending, 4) }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: copy.chipAria(copy.overdue, 1) }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.chipAria(copy.all, 9) }),
    ).toBeInTheDocument();
  });

  it("keeps view counts for support RO and hides mutation CTAs", () => {
    mockUsePlatformAuth.mockReturnValue(authUser("platform_support"));
    renderPage();

    const copy = platformCopy.ar.views;
    expect(
      screen.getByRole("button", { name: copy.chipAria(copy.pending, 4) }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.chipAria(copy.overdue, 1) }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(platformCopy.ar.readOnlyAlert),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: platformCopy.ar.actions.markPaid,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: platformCopy.ar.actions.void,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: platformCopy.ar.actions.issue,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", {
        name: platformCopy.ar.columns.actions,
      }),
    ).not.toBeInTheDocument();
    expect(platformCopy.ar.description).not.toMatch(/registra el pago/i);
  });

  it("shows still-pending strip when the close-run has not run", () => {
    mockUsePlatformArCloseRun.mockReturnValue(
      closeRunResult({ ran: false, actionable: 0 }),
    );
    renderPage();

    expect(
      screen.getByText(platformCopy.ar.closeRun.notYetTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(platformCopy.ar.closeRun.notYetDescription),
    ).toBeInTheDocument();
    expect(
      screen.getByText(platformCopy.ar.closeRun.notYetDescription)
        .textContent,
    ).not.toMatch(/CSV|CFDI/i);
    expect(
      screen.getByRole("button", {
        name: platformCopy.ar.views.exceptions,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: platformCopy.ar.views.chipAria(
          platformCopy.ar.views.exceptions,
          0,
        ),
      }),
    ).not.toBeInTheDocument();
  });

  it("shows zero-exceptions strip after a successful run", () => {
    renderPage();

    expect(
      screen.getByText(platformCopy.ar.closeRun.zeroTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(platformCopy.ar.closeRun.zeroDescription),
    ).toBeInTheDocument();
    expect(platformCopy.ar.closeRun.zeroDescription).not.toMatch(/CSV|CFDI/i);
    expect(
      screen.getByText(new RegExp(platformCopy.ar.closeRun.csvCaption)),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/exportar cierre.*Nuevo cobro/i),
    ).not.toBeInTheDocument();
  });

  it("names a skipped_no_band cut as no billable fleet", () => {
    mockUsePlatformArCloseRun.mockReturnValue(
      closeRunResult({
        actionable: 1,
        items: [
          {
            tenantId: "tenant-mecapa",
            tenantName: "Transportes Mecapa",
            subdomain: "mecapa",
            skipReason: "CUT_NO_FLEET",
            skipGroup: "actionable",
            canIssueOverride: false,
            hasFrozenAmount: false,
          },
        ],
      }),
    );
    renderPage("/platform/billing/ar?view=exceptions");

    expect(
      screen.getAllByText(platformCopy.ar.skipReasons.CUT_NO_FLEET).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText(platformCopy.ar.skipReasons.CUT_NOT_BILLABLE),
    ).not.toBeInTheDocument();
  });

  it("lists only actionable skips on view=exceptions with reason and tenant link", () => {
    mockUsePlatformArCloseRun.mockReturnValue(
      closeRunResult({
        actionable: 1,
        items: [
          {
            tenantId: "tenant-void",
            tenantName: "Transportes Hueco",
            subdomain: "hueco",
            skipReason: "VOID_HOLD",
            skipGroup: "actionable",
            canIssueOverride: true,
            hasFrozenAmount: true,
          },
        ],
      }),
    );
    renderPage("/platform/billing/ar?view=exceptions");

    expect(
      screen.getByText(platformCopy.ar.closeRun.actionableTitle(1)),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(platformCopy.ar.skipReasons.VOID_HOLD).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(platformCopy.ar.closeRun.actionableOnExceptions),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Transportes Hueco" })[0],
    ).toHaveAttribute(
      "href",
      "/platform/tenants/tenant-void?tab=commercial",
    );
    expect(
      screen.getAllByRole("button", { name: platformCopy.ar.actions.issue })
        .length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText(platformCopy.ar.status.open),
    ).not.toBeInTheDocument();
  });

  it("hides Nuevo cobro on exceptions for support and keeps Ver empresa", () => {
    mockUsePlatformAuth.mockReturnValue(authUser("platform_support"));
    mockUsePlatformArCloseRun.mockReturnValue(
      closeRunResult({
        actionable: 1,
        items: [
          {
            tenantId: "tenant-void",
            tenantName: "Transportes Hueco",
            subdomain: "hueco",
            skipReason: "VOID_HOLD",
            skipGroup: "actionable",
            canIssueOverride: true,
            hasFrozenAmount: true,
          },
        ],
      }),
    );
    renderPage("/platform/billing/ar?view=exceptions");

    expect(
      screen.queryByRole("button", {
        name: platformCopy.ar.actions.issue,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("link", {
        name: platformCopy.ar.actions.viewTenant,
      })[0],
    ).toHaveAttribute(
      "href",
      "/platform/tenants/tenant-void?tab=commercial",
    );
  });

  it("offers Ver excepciones from Pendientes when M>0", async () => {
    const user = userEvent.setup();
    mockUsePlatformArCloseRun.mockReturnValue(
      closeRunResult({
        actionable: 1,
        items: [
          {
            tenantId: "tenant-void",
            tenantName: "Transportes Hueco",
            subdomain: "hueco",
            skipReason: "VOID_HOLD",
            skipGroup: "actionable",
            canIssueOverride: true,
            hasFrozenAmount: true,
          },
        ],
      }),
    );
    renderPage();

    expect(
      screen.getByText(platformCopy.ar.closeRun.actionableDescription),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(platformCopy.ar.closeRun.actionableOnExceptions),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: platformCopy.ar.closeRun.viewExceptions,
      }),
    ).toHaveAttribute("type", "button");

    await user.click(
      screen.getByRole("button", {
        name: platformCopy.ar.closeRun.viewExceptions,
      }),
    );

    expect(
      screen.getByRole("button", {
        name: platformCopy.ar.views.chipAria(
          platformCopy.ar.views.exceptions,
          1,
        ),
      }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByText(platformCopy.ar.closeRun.actionableOnExceptions),
    ).toBeInTheDocument();
  });

  it("labels the period filter and keeps refresh in the filter row", () => {
    renderPage();

    const periodField = screen.getByLabelText(platformCopy.ar.filters.periodKey);
    expect(periodField).toHaveTextContent(
      platformCopy.ar.filters.periodKeyPlaceholder,
    );
    expect(periodField).not.toHaveTextContent("2026-07");
    expect(
      screen.getByRole("button", { name: platformCopy.ar.refreshAria }),
    ).toBeInTheDocument();
    expect(document.querySelector('label[for="ar-tenant-filter"]')).toHaveTextContent(
      platformCopy.ar.filters.tenant,
    );
  });

  it("shows Auto-emitido badge on auto-issued rows without an origin filter", () => {
    mockUsePlatformArList.mockReturnValue({
      data: {
        data: [buildRow({ origin: "auto_period_issue" })],
        pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderPage();

    expect(
      screen.getAllByText(platformCopy.ar.origin.auto).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByLabelText(/origen/i),
    ).not.toBeInTheDocument();
  });

  it("shows charge-run strip with CTA to Pendientes, not Excepciones", async () => {
    const user = userEvent.setup();
    mockUsePlatformArChargeRun.mockReturnValue(
      chargeRunResult({
        failed: 1,
        requiresAction: 1,
        noPaymentMethod: 2,
        latestAttempts: [{ saasInvoiceId: "inv-1", outcome: "failed" }],
      }),
    );
    renderPage("/platform/billing/ar?view=all");

    expect(
      screen.getByText(platformCopy.ar.chargeRun.ranTitle),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(platformCopy.ar.chargeChip.failed).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", {
        name: platformCopy.ar.chargeRun.viewPending,
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: platformCopy.ar.chargeRun.viewPending,
      }),
    );

    expect(
      screen.getByRole("button", {
        name: platformCopy.ar.views.chipAria(platformCopy.ar.views.pending, 4),
      }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.queryByRole("button", {
        name: platformCopy.ar.chargeRun.viewPending,
      }),
    ).not.toBeInTheDocument();
  });

  it("does not list card failures inside view=exceptions", () => {
    mockUsePlatformArChargeRun.mockReturnValue(
      chargeRunResult({
        failed: 1,
        latestAttempts: [{ saasInvoiceId: "inv-fail", outcome: "failed" }],
        items: [
          {
            tenantId: "tenant-card",
            tenantName: "Transportes Tarjeta",
            saasInvoiceId: "inv-fail",
            skipReason: null,
            outcome: "failed",
          },
        ],
      }),
    );
    renderPage("/platform/billing/ar?view=exceptions");

    expect(
      screen.getByText(platformCopy.ar.chargeRun.ranTitle),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Transportes Tarjeta"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: platformCopy.ar.chargeRun.viewPending,
      }),
    ).toBeInTheDocument();
  });
});
