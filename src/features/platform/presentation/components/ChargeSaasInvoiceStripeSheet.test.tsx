import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PlatformSaasInvoice } from "../../domain/entities";
import { ChargeSaasInvoiceStripeSheet } from "./ChargeSaasInvoiceStripeSheet";
import { platformCopy } from "../copy/platformCopy";
import { platformApi } from "../../infrastructure/platformApi";
import { formatBillingPriceCents } from "../utils/platformBillingFormatters";

vi.mock("../../infrastructure/platformApi", () => ({
  platformApi: {
    listTenantPaymentMethods: vi.fn(),
    chargeSaasInvoiceStripe: vi.fn(),
  },
}));

const confirmCardPaymentIfRequired = vi.fn();
vi.mock("@features/billing", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/billing")>();
  return {
    ...actual,
    confirmCardPaymentIfRequired: (...args: unknown[]) =>
      confirmCardPaymentIfRequired(...args),
  };
});

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
  };
});

const mockedApi = vi.mocked(platformApi);
const copy = platformCopy.ar.chargeStripe;

const openInvoice: PlatformSaasInvoice = {
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
  daysOverdue: 0,
  origin: "manual",
  createdAt: "2026-08-01T16:00:00.000Z",
  updatedAt: "2026-08-01T16:00:00.000Z",
};

const defaultPm = {
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
};

function renderSheet(
  props?: Partial<Parameters<typeof ChargeSaasInvoiceStripeSheet>[0]>,
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ChargeSaasInvoiceStripeSheet
        invoice={openInvoice}
        open
        onOpenChange={vi.fn()}
        {...props}
      />
    </QueryClientProvider>,
  );
}

describe("ChargeSaasInvoiceStripeSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.listTenantPaymentMethods.mockResolvedValue([defaultPm]);
    mockedApi.chargeSaasInvoiceStripe.mockResolvedValue({
      saasInvoiceId: "inv-1",
      status: "paid",
      gatewayPaymentId: "pi_1",
      amountCents: 197200,
      clientSecret: null,
    });
  });

  it("shows amount_due read-only and charges on confirm", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderSheet({ onOpenChange });

    expect(
      await screen.findByText(formatBillingPriceCents(197200)),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.amountHint)).toBeInTheDocument();
    expect(
      await screen.findByText((content) => content.includes("••4242")),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: copy.submit }));

    await waitFor(() => {
      expect(mockedApi.chargeSaasInvoiceStripe).toHaveBeenCalledWith(
        "tenant-1",
        "inv-1",
      );
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("disables confirm when tenant has no default card", async () => {
    mockedApi.listTenantPaymentMethods.mockResolvedValue([]);
    renderSheet();

    expect(await screen.findByText(copy.cardMissing)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.submit })).toBeDisabled();
  });

  it("runs confirmCardPayment when charge returns requires_action", async () => {
    const user = userEvent.setup();
    mockedApi.chargeSaasInvoiceStripe.mockResolvedValue({
      saasInvoiceId: "inv-1",
      status: "requires_action",
      gatewayPaymentId: "pi_2",
      clientSecret: "pi_2_secret_test",
    });
    confirmCardPaymentIfRequired.mockResolvedValue({ ok: true });

    renderSheet();
    await screen.findByText(formatBillingPriceCents(197200));
    await user.click(screen.getByRole("button", { name: copy.submit }));

    await waitFor(() => {
      expect(confirmCardPaymentIfRequired).toHaveBeenCalledWith(
        "pi_2_secret_test",
      );
    });
  });
});
