import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Invoice } from "@features/invoicing/domain";
import { PaymentFormDialog } from "./PaymentFormDialog";

const mutateMock = vi.fn();

vi.mock("@features/invoicing/application", () => ({
  useRegisterPayment: () => ({
    mutate: mutateMock,
    isPending: false,
  }),
}));

vi.mock("@features/catalogs/presentation/components", () => ({
  FormaPagoSelect: ({
    value,
    onValueChange,
  }: {
    value: string;
    onValueChange: (value: string) => void;
  }) => (
    <select
      aria-label="Forma de pago"
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    >
      <option value="03">03</option>
    </select>
  ),
}));

function buildInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: "inv-1",
    tenantId: "tenant-1",
    serie: "A",
    folio: 10,
    cfdiUuid: "uuid",
    invoiceType: "ingreso",
    parentInvoiceId: null,
    issuerRfc: "AAA010101AAA",
    issuerName: "Emisor",
    issuerTaxRegime: "601",
    issueLocation: "26015",
    receiverRfc: "XAXX010101000",
    receiverName: "Cliente",
    cfdiUsage: "G03",
    receiverTaxRegime: "616",
    receiverPostalCode: "26015",
    issuedAt: "2026-06-01T12:00:00.000Z",
    paymentForm: "99",
    paymentMethod: "PPD",
    currency: "USD",
    exchangeRate: 18.5,
    subtotal: 1000,
    discount: 0,
    totalTax: 160,
    retainedTax: 0,
    total: 1160,
    status: "stamped",
    satCancellationStatus: "none",
    satCancellationMessage: null,
    satCancellationUpdatedAt: null,
    pacProvider: "profact",
    xmlContent: null,
    hasStampedXml: false,
    qrCode: null,
    pdfUrl: null,
    stampedAt: "2026-06-01T12:05:00.000Z",
    cancelledAt: null,
    cancellationReason: null,
    cancellationCode: null,
    replacementCfdiUuid: null,
    notes: null,
    trips: [],
    payments: [],
    totalPaid: 0,
    balanceDue: 1160,
    canSubstituteInvoice: false,
    createdAt: "2026-06-01T12:00:00.000Z",
    updatedAt: "2026-06-01T12:05:00.000Z",
    createdBy: "user-1",
    updatedBy: "user-1",
    createdByName: "Admin",
    updatedByName: "Admin",
    ...overrides,
  };
}

describe("PaymentFormDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits invoice exchange rate and effective balance", async () => {
    const user = userEvent.setup();
    render(
      <PaymentFormDialog
        invoice={buildInvoice()}
        open
        onOpenChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Registrar pago/i }));

    expect(mutateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        exchangeRate: 18.5,
        currency: "USD",
        amount: 1160,
      }),
    );
  });
});
