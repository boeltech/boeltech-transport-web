import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TenantSaasArCard } from "./TenantSaasArCard";
import { platformCopy } from "../copy/platformCopy";
import { formatBillingPeriodKey } from "../utils/platformBillingFormatters";
import { formatDate } from "@shared/utils/dateUtils";
import { platformApi } from "../../infrastructure/platformApi";
import type { PlatformSaasInvoice } from "../../domain/entities";

vi.mock("../../infrastructure/platformApi", () => ({
  platformApi: {
    listTenantSaasInvoices: vi.fn(),
    listTenantPaymentMethods: vi.fn(),
    downloadTenantReconciliationCsv: vi.fn(),
    getTenantReconciliationJson: vi.fn(),
    getArCloseRun: vi.fn(),
    getArChargeRun: vi.fn(),
    issueSaasInvoice: vi.fn(),
    issueSaasInvoiceDraft: vi.fn(),
    chargeSaasInvoiceStripe: vi.fn(),
  },
}));

const isStripePublishableConfigured = vi.fn(() => false);
vi.mock("@features/billing", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/billing")>();
  return {
    ...actual,
    isStripePublishableConfigured: () => isStripePublishableConfigured(),
    isSaasStripeNotConfiguredError: actual.isSaasStripeNotConfiguredError,
  };
});

const toastMock = vi.fn();
vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: toastMock }),
  };
});

const mockedApi = vi.mocked(platformApi);

function saasInvoice(
  overrides: Partial<PlatformSaasInvoice> = {},
): PlatformSaasInvoice {
  return {
    id: "inv-1",
    tenantId: "tenant-1",
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
    daysOverdue: 2,
    origin: "manual",
    lastPayment: null,
    createdAt: "2026-08-01T16:00:00.000Z",
    updatedAt: "2026-08-01T16:00:00.000Z",
    ...overrides,
  };
}

function methodCell() {
  const dataRow = screen
    .getAllByRole("row")
    .find((row) => within(row).queryAllByRole("cell").length > 0);
  expect(dataRow).toBeTruthy();
  return within(dataRow!).getAllByRole("cell")[4];
}

function renderCard(canMutate: boolean) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TenantSaasArCard
          tenantId="tenant-1"
          tenantLabel="Demo"
          canMutate={canMutate}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("TenantSaasArCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isStripePublishableConfigured.mockReturnValue(false);
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-08-10T18:00:00.000Z"));
    mockedApi.listTenantSaasInvoices.mockResolvedValue([saasInvoice()]);
    mockedApi.listTenantPaymentMethods.mockResolvedValue([]);
    mockedApi.downloadTenantReconciliationCsv.mockResolvedValue(undefined);
    mockedApi.getArChargeRun.mockResolvedValue({
      data: {
        run: {
          ran: false,
          id: null,
          ranAt: null,
          trigger: null,
          considered: 0,
          charged: 0,
          errors: 0,
        },
        counts: {
          charged: 0,
          noPaymentMethod: 0,
          failed: 0,
          requiresAction: 0,
          processing: 0,
          skippedOther: 0,
        },
        items: [],
        latestAttempts: [],
      },
      pagination: { page: 1, limit: 25, total: 0, totalPages: 0 },
    });
    mockedApi.getArCloseRun.mockResolvedValue({
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
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("hides emitir / pagar / anular when canMutate is false", async () => {
    renderCard(false);

    expect(
      await screen.findByText(formatBillingPeriodKey("2026-07")),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: platformCopy.ar.actions.issue }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: platformCopy.ar.actions.markPaid,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: platformCopy.ar.actions.void }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: platformCopy.ar.card.viewAll }),
    ).toHaveAttribute(
      "href",
      "/platform/billing/ar?tenant_id=tenant-1&view=all",
    );
    expect(
      screen.queryByRole("columnheader", {
        name: platformCopy.ar.columns.actions,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: platformCopy.ar.card.exportClose,
      }),
    ).toBeInTheDocument();
  });

  it("shows mutation CTAs for platform owner", async () => {
    renderCard(true);

    expect(
      await screen.findByText(formatBillingPeriodKey("2026-07")),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: platformCopy.ar.actions.issue,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: platformCopy.ar.actions.markPaid }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: platformCopy.ar.actions.void }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: platformCopy.ar.actions.chargeStripe,
      }),
    ).not.toBeInTheDocument();
  });

  it("shows Cobrar con Stripe when publishable key and default PM exist", async () => {
    isStripePublishableConfigured.mockReturnValue(true);
    mockedApi.listTenantPaymentMethods.mockResolvedValue([
      {
        id: "pm-1",
        tenantId: "tenant-1",
        gateway: "stripe",
        gatewayPaymentMethodId: "pm_stripe",
        brand: "visa",
        last4: "4242",
        expMonth: 12,
        expYear: 2030,
        isDefault: true,
        createdAt: "2026-08-01T16:00:00.000Z",
        updatedAt: "2026-08-01T16:00:00.000Z",
      },
    ]);

    renderCard(true);

    expect(
      await screen.findByRole("button", {
        name: platformCopy.ar.actions.chargeStripe,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(platformCopy.ar.card.cardOnFile("4242")),
    ).toBeInTheDocument();
  });

  it("hides Cobrar con Stripe for support (canMutate false) even with Stripe ready", async () => {
    isStripePublishableConfigured.mockReturnValue(true);
    mockedApi.listTenantPaymentMethods.mockResolvedValue([
      {
        id: "pm-1",
        tenantId: "tenant-1",
        gateway: "stripe",
        gatewayPaymentMethodId: "pm_stripe",
        brand: "visa",
        last4: "4242",
        expMonth: 12,
        expYear: 2030,
        isDefault: true,
        createdAt: "2026-08-01T16:00:00.000Z",
        updatedAt: "2026-08-01T16:00:00.000Z",
      },
    ]);

    renderCard(false);

    expect(
      await screen.findByText(formatBillingPeriodKey("2026-07")),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: platformCopy.ar.actions.chargeStripe,
      }),
    ).not.toBeInTheDocument();
  });

  it("defaults close period to last closed month and exports CSV", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderCard(true);

    const periodInput = await screen.findByLabelText(
      platformCopy.ar.card.closePeriodLabel,
    );
    expect(periodInput).toHaveValue("2026-07");

    await user.click(
      screen.getByRole("button", {
        name: platformCopy.ar.card.exportClose,
      }),
    );

    await waitFor(() => {
      expect(mockedApi.downloadTenantReconciliationCsv).toHaveBeenCalledWith(
        "tenant-1",
        "2026-07",
      );
    });
  });

  it("opens Nuevo cobro with the selected closed export period", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockedApi.listTenantSaasInvoices.mockResolvedValue([]);
    mockedApi.getTenantReconciliationJson.mockResolvedValue({
      tenantId: "tenant-1",
      tenantName: "Demo",
      subdomain: "demo",
      periodKey: "2026-06",
      planCode: "operacion_crecimiento",
      planName: "Crecimiento",
      monthlyPriceCents: 150000,
      billingCycle: "monthly",
      status: "active",
      includedStamps: 380,
      stampsUsed: 10,
      overageStamps: 0,
      overagePriceCents: 1000,
      overageTotalCents: 0,
      activeModules: [],
      modulesTotalCents: 0,
      subtotalCents: 150000,
      ivaCents: 24000,
      totalCents: 174000,
    });

    renderCard(true);

    const periodInput = await screen.findByLabelText(
      platformCopy.ar.card.closePeriodLabel,
    );
    await user.clear(periodInput);
    await user.type(periodInput, "2026-06");

    await user.click(
      screen.getByRole("button", { name: platformCopy.ar.actions.issue }),
    );

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
    expect(screen.getByRole("dialog").querySelector("#periodKey")).toHaveValue(
      "2026-06",
    );
  });

  it("shows Borrador badge and Emitir for draft invoices", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockedApi.listTenantSaasInvoices.mockResolvedValue([
      {
        id: "inv-draft",
        tenantId: "tenant-1",
        subscriptionId: "sub-1",
        periodKey: "2026-07",
        periodStart: "2026-07-01T06:00:00.000Z",
        periodEnd: "2026-08-01T06:00:00.000Z",
        status: "draft",
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
        issuedAt: null,
        dueDate: null,
        paidAt: null,
        voidedAt: null,
        voidReason: null,
        notes: null,
        daysOverdue: 0,
        origin: "manual",
        lastPayment: null,
        createdAt: "2026-08-01T16:00:00.000Z",
        updatedAt: "2026-08-01T16:00:00.000Z",
      },
    ]);
    mockedApi.issueSaasInvoiceDraft.mockResolvedValue({
      id: "inv-draft",
      tenantId: "tenant-1",
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
      issuedAt: "2026-08-10T18:00:00.000Z",
      dueDate: "2026-08-24T18:00:00.000Z",
      paidAt: null,
      voidedAt: null,
      voidReason: null,
      notes: null,
      daysOverdue: 0,
      origin: "manual",
      lastPayment: null,
      createdAt: "2026-08-01T16:00:00.000Z",
      updatedAt: "2026-08-10T18:00:00.000Z",
      items: [],
      payments: [],
    });

    renderCard(true);

    expect(
      await screen.findByText(platformCopy.ar.status.draft),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: platformCopy.ar.actions.markPaid,
      }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: platformCopy.ar.actions.issueDraft,
      }),
    );

    await waitFor(() => {
      expect(mockedApi.issueSaasInvoiceDraft).toHaveBeenCalledWith(
        "tenant-1",
        "inv-draft",
        undefined,
      );
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: platformCopy.ar.actions.issueDraftSuccess,
      }),
    );
  });

  it("hides Nuevo cobro and shows policy banner on trial skip", async () => {
    mockedApi.listTenantSaasInvoices.mockResolvedValue([]);
    mockedApi.getArCloseRun.mockResolvedValue({
      data: {
        periodKey: "2026-07",
        run: {
          ran: true,
          ranAt: "2026-08-01T06:05:00.000Z",
          issuedCount: 0,
          consideredCount: 1,
          errorsCount: 0,
        },
        counts: { actionable: 0, policy: 1 },
        items: [
          {
            tenantId: "tenant-1",
            tenantName: "Demo",
            subdomain: "demo",
            skipReason: "SUB_NOT_ELIGIBLE",
            skipGroup: "policy",
            subscriptionStatus: "trialing",
            cutStatus: null,
            estimatedTotalCents: 0,
            hasFrozenAmount: false,
            canIssueOverride: false,
            existingVoidInvoiceId: null,
            nonVoidInvoiceId: null,
          },
        ],
      },
      pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
    });

    renderCard(true);

    expect(
      await screen.findByText(platformCopy.ar.card.skipBannerPolicy),
    ).toBeInTheDocument();
    expect(
      screen.getByText(platformCopy.ar.skipReasons.SUB_NOT_ELIGIBLE),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: platformCopy.ar.actions.issue }),
    ).not.toBeInTheDocument();
  });

  it("shows Nuevo cobro for void-hold with frozen amount", async () => {
    mockedApi.listTenantSaasInvoices.mockResolvedValue([]);
    mockedApi.getArCloseRun.mockResolvedValue({
      data: {
        periodKey: "2026-07",
        run: {
          ran: true,
          ranAt: "2026-08-01T06:05:00.000Z",
          issuedCount: 0,
          consideredCount: 1,
          errorsCount: 0,
        },
        counts: { actionable: 1, policy: 0 },
        items: [
          {
            tenantId: "tenant-1",
            tenantName: "Demo",
            subdomain: "demo",
            skipReason: "VOID_HOLD",
            skipGroup: "actionable",
            subscriptionStatus: "active",
            cutStatus: "draft",
            estimatedTotalCents: 174000,
            hasFrozenAmount: true,
            canIssueOverride: true,
            existingVoidInvoiceId: "inv-void",
            nonVoidInvoiceId: null,
          },
        ],
      },
      pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
    });

    renderCard(true);

    expect(
      await screen.findByText(platformCopy.ar.card.skipBannerTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: platformCopy.ar.actions.issue }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: platformCopy.ar.card.viewAll }),
    ).toHaveAttribute(
      "href",
      "/platform/billing/ar?view=exceptions&tenant_id=tenant-1",
    );
  });

  it("shows Auto-emitido badge on auto-issued cargo", async () => {
    mockedApi.listTenantSaasInvoices.mockResolvedValue([
      saasInvoice({ origin: "auto_period_issue" }),
    ]);

    renderCard(true);

    expect(
      await screen.findByText(platformCopy.ar.origin.auto),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: platformCopy.ar.actions.issue }),
    ).not.toBeInTheDocument();
  });

  it("blocks close export for open month", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderCard(true);

    const periodInput = await screen.findByLabelText(
      platformCopy.ar.card.closePeriodLabel,
    );
    await user.clear(periodInput);
    await user.type(periodInput, "2026-08");

    await user.click(
      screen.getByRole("button", {
        name: platformCopy.ar.card.exportClose,
      }),
    );

    expect(mockedApi.downloadTenantReconciliationCsv).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: platformCopy.ar.card.exportCloseError,
        description: platformCopy.ar.card.exportCloseNotClosed,
      }),
    );
  });

  it("shows auto-charge chip from latest_attempts next to Estado", async () => {
    mockedApi.getArChargeRun.mockResolvedValue({
      data: {
        run: {
          ran: true,
          id: "run-1",
          ranAt: "2026-09-23T12:05:00.000Z",
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
            saasInvoiceId: "inv-1",
            outcome: "failed",
            skipReason: null,
            failureCode: "card_declined",
            createdAt: "2026-09-23T12:05:00.000Z",
          },
        ],
      },
      pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
    });

    renderCard(true);

    expect(
      await screen.findByText(platformCopy.ar.chargeChip.failed),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: platformCopy.ar.actions.markPaid }),
    ).toBeInTheDocument();
  });

  it("shows paidAt as Cobrado and hides due date on paid rows", async () => {
    const paidAt = "2026-08-03T12:00:00.000Z";
    const dueDate = "2026-09-15T16:00:00.000Z";
    mockedApi.listTenantSaasInvoices.mockResolvedValue([
      saasInvoice({
        id: "inv-paid",
        status: "paid",
        amountDueCents: 0,
        amountPaidCents: 197200,
        paidAt,
        dueDate,
        daysOverdue: 0,
      }),
    ]);

    renderCard(false);

    expect(
      await screen.findByText(
        `${platformCopy.ar.card.paidCaption} ${formatDate(paidAt)}`,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(formatDate(dueDate))).not.toBeInTheDocument();
    expect(
      screen.getByText(platformCopy.ar.card.description),
    ).toBeInTheDocument();
  });

  it("keeps due date and overdue on open rows", async () => {
    renderCard(false);

    expect(
      await screen.findByText(formatDate("2026-08-15T16:00:00.000Z")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(platformCopy.ar.card.daysOverdue(2)),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(new RegExp(`^${platformCopy.ar.card.paidCaption}`)),
    ).not.toBeInTheDocument();
  });

  it("D3: last 12 months by periodKey, plus open/draft older than the window", async () => {
    mockedApi.listTenantSaasInvoices.mockResolvedValue([
      saasInvoice({
        id: "inv-paid-recent",
        periodKey: "2026-07",
        status: "paid",
        paidAt: "2026-08-03T12:00:00.000Z",
        daysOverdue: 0,
      }),
      saasInvoice({
        id: "inv-paid-old",
        periodKey: "2025-07",
        status: "paid",
        paidAt: "2025-08-03T12:00:00.000Z",
        daysOverdue: 0,
      }),
      saasInvoice({
        id: "inv-open-old",
        periodKey: "2025-01",
        status: "open",
        daysOverdue: 5,
      }),
      saasInvoice({
        id: "inv-draft-old",
        periodKey: "2024-12",
        status: "draft",
        issuedAt: null,
        dueDate: null,
        daysOverdue: 0,
      }),
      saasInvoice({
        id: "inv-void-old",
        periodKey: "2025-01",
        status: "void",
        voidedAt: "2025-02-01T12:00:00.000Z",
        daysOverdue: 0,
      }),
    ]);

    renderCard(false);

    expect(
      await screen.findByText(formatBillingPeriodKey("2026-07")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(formatBillingPeriodKey("2025-01")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(formatBillingPeriodKey("2024-12")),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(formatBillingPeriodKey("2025-07")),
    ).not.toBeInTheDocument();
    expect(screen.getByText(platformCopy.ar.status.paid)).toBeInTheDocument();
    expect(screen.getByText(platformCopy.ar.status.open)).toBeInTheDocument();
    expect(screen.getByText(platformCopy.ar.status.draft)).toBeInTheDocument();
    expect(
      screen.queryByText(platformCopy.ar.status.void),
    ).not.toBeInTheDocument();
  });

  it("void rows in the 12-month window show status without due date", async () => {
    const dueDate = "2026-08-20T16:00:00.000Z";
    mockedApi.listTenantSaasInvoices.mockResolvedValue([
      saasInvoice({
        id: "inv-void",
        status: "void",
        dueDate,
        voidedAt: "2026-08-04T12:00:00.000Z",
        daysOverdue: 0,
      }),
    ]);

    renderCard(false);

    expect(
      await screen.findByText(platformCopy.ar.status.void),
    ).toBeInTheDocument();
    expect(screen.queryByText(formatDate(dueDate))).not.toBeInTheDocument();
  });

  it("shows Tarjeta for paid last_payment.method=stripe", async () => {
    mockedApi.listTenantSaasInvoices.mockResolvedValue([
      saasInvoice({
        status: "paid",
        amountDueCents: 0,
        amountPaidCents: 197200,
        paidAt: "2026-08-03T12:00:00.000Z",
        daysOverdue: 0,
        lastPayment: {
          paidAt: "2026-08-03T12:00:00.000Z",
          method: "stripe",
        },
      }),
    ]);

    renderCard(false);

    expect(
      await screen.findByRole("columnheader", {
        name: platformCopy.ar.columns.method,
      }),
    ).toBeInTheDocument();
    expect(methodCell()).toHaveTextContent(
      platformCopy.ar.markPaid.methods.stripe,
    );
  });

  it("shows em dash when paid last_payment is null", async () => {
    mockedApi.listTenantSaasInvoices.mockResolvedValue([
      saasInvoice({
        status: "paid",
        amountDueCents: 0,
        amountPaidCents: 0,
        paidAt: "2026-08-03T12:00:00.000Z",
        daysOverdue: 0,
        lastPayment: null,
      }),
    ]);

    renderCard(false);

    expect(
      await screen.findByRole("columnheader", {
        name: platformCopy.ar.columns.method,
      }),
    ).toBeInTheDocument();
    expect(methodCell()).toHaveTextContent("—");
  });

  it("D5: defaultPm.last4 never appears in the method cell", async () => {
    isStripePublishableConfigured.mockReturnValue(true);
    mockedApi.listTenantPaymentMethods.mockResolvedValue([
      {
        id: "pm-1",
        tenantId: "tenant-1",
        gateway: "stripe",
        gatewayPaymentMethodId: "pm_stripe",
        brand: "visa",
        last4: "4242",
        expMonth: 12,
        expYear: 2030,
        isDefault: true,
        createdAt: "2026-08-01T16:00:00.000Z",
        updatedAt: "2026-08-01T16:00:00.000Z",
      },
    ]);
    mockedApi.listTenantSaasInvoices.mockResolvedValue([
      saasInvoice({
        status: "paid",
        amountDueCents: 0,
        amountPaidCents: 197200,
        paidAt: "2026-08-03T12:00:00.000Z",
        daysOverdue: 0,
        lastPayment: {
          paidAt: "2026-08-03T12:00:00.000Z",
          method: "stripe",
        },
      }),
    ]);

    renderCard(true);

    expect(
      await screen.findByText(platformCopy.ar.card.cardOnFile("4242")),
    ).toBeInTheDocument();
    const cell = methodCell();
    expect(cell).toHaveTextContent(platformCopy.ar.markPaid.methods.stripe);
    expect(cell).not.toHaveTextContent("4242");
    expect(cell.textContent).not.toMatch(/•{1,2}4242/);
  });

  it("keeps Auto-emitido and auto-charge chip distinct from Método", async () => {
    mockedApi.listTenantSaasInvoices.mockResolvedValue([
      saasInvoice({
        origin: "auto_period_issue",
        lastPayment: null,
      }),
    ]);
    mockedApi.getArChargeRun.mockResolvedValue({
      data: {
        run: {
          ran: true,
          id: "run-1",
          ranAt: "2026-09-23T12:05:00.000Z",
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
            saasInvoiceId: "inv-1",
            outcome: "failed",
            skipReason: null,
            failureCode: "card_declined",
            createdAt: "2026-09-23T12:05:00.000Z",
          },
        ],
      },
      pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
    });

    renderCard(true);

    expect(
      await screen.findByText(platformCopy.ar.origin.auto),
    ).toBeInTheDocument();
    expect(
      screen.getByText(platformCopy.ar.chargeChip.failed),
    ).toBeInTheDocument();
    expect(methodCell()).toHaveTextContent("—");
    expect(methodCell()).not.toHaveTextContent(platformCopy.ar.origin.auto);
    expect(methodCell()).not.toHaveTextContent(
      platformCopy.ar.chargeChip.failed,
    );
  });
});
