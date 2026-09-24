import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TenantSaasArCard } from "./TenantSaasArCard";
import { platformCopy } from "../copy/platformCopy";
import { formatBillingPeriodKey } from "../utils/platformBillingFormatters";
import { platformApi } from "../../infrastructure/platformApi";

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
    mockedApi.listTenantSaasInvoices.mockResolvedValue([
      {
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
        createdAt: "2026-08-01T16:00:00.000Z",
        updatedAt: "2026-08-01T16:00:00.000Z",
      },
    ]);
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
      screen.getByRole("link", { name: platformCopy.ar.actions.viewAr }),
    ).toHaveAttribute(
      "href",
      "/platform/billing/ar?status=open&tenant_id=tenant-1",
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
      screen.getByRole("link", { name: platformCopy.ar.actions.viewAr }),
    ).toHaveAttribute(
      "href",
      "/platform/billing/ar?view=exceptions&tenant_id=tenant-1",
    );
  });

  it("shows Auto-emitido badge on auto-issued cargo", async () => {
    mockedApi.listTenantSaasInvoices.mockResolvedValue([
      {
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
        origin: "auto_period_issue",
        createdAt: "2026-08-01T16:00:00.000Z",
        updatedAt: "2026-08-01T16:00:00.000Z",
      },
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
});
