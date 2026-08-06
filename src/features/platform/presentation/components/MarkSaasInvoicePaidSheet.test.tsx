import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PlatformSaasInvoice } from "../../domain/entities";
import { MarkSaasInvoicePaidSheet } from "./MarkSaasInvoicePaidSheet";
import { platformCopy } from "../copy/platformCopy";
import { platformApi } from "../../infrastructure/platformApi";

vi.mock("../../infrastructure/platformApi", () => ({
  platformApi: {
    markSaasInvoicePaid: vi.fn(),
  },
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
  };
});

const mockedApi = vi.mocked(platformApi);

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
  createdAt: "2026-08-01T16:00:00.000Z",
  updatedAt: "2026-08-01T16:00:00.000Z",
};

function renderSheet(
  props?: Partial<Parameters<typeof MarkSaasInvoicePaidSheet>[0]>,
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MarkSaasInvoicePaidSheet
        invoice={openInvoice}
        open
        onOpenChange={vi.fn()}
        {...props}
      />
    </QueryClientProvider>,
  );
}

const copy = platformCopy.ar.markPaid;

describe("MarkSaasInvoicePaidSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.markSaasInvoicePaid.mockResolvedValue({
      ...openInvoice,
      status: "paid",
      amountDueCents: 0,
      amountPaidCents: 197200,
      paidAt: "2026-08-03T12:00:00.000Z",
      items: [],
      payments: [],
    });
  });

  it("submits mark-paid with method and reference", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderSheet({ onOpenChange });

    await user.type(screen.getByLabelText(copy.reference), "SPEI-9988");
    await user.click(screen.getByRole("button", { name: copy.submit }));

    await waitFor(() => {
      expect(mockedApi.markSaasInvoicePaid).toHaveBeenCalledWith(
        "tenant-1",
        "inv-1",
        expect.objectContaining({
          method: "spei",
          reference: "SPEI-9988",
          notes: null,
          paidAt: expect.any(String),
        }),
      );
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
