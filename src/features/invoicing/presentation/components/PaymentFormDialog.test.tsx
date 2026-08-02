import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Invoice } from "@features/invoicing/domain";
import { TooltipProvider } from "@shared/ui/tooltip";
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
    receiverName: "Cliente Demo SA",
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
    concepts: [],
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

function renderDialog(invoice: Invoice = buildInvoice()) {
  return render(
    <TooltipProvider>
      <PaymentFormDialog invoice={invoice} open onOpenChange={vi.fn()} />
    </TooltipProvider>,
  );
}

describe("PaymentFormDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows operative title, folio, client and balance without PPD/REP in the title", () => {
    renderDialog();

    expect(
      screen.getByRole("heading", { name: "Registrar pago" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/PPD\s*\/\s*REP/i)).not.toBeInTheDocument();
    expect(screen.getByText("A-10 · Cliente Demo SA")).toBeInTheDocument();
    expect(screen.getByText("Por cobrar")).toBeInTheDocument();
    expect(screen.getByText("Datos adicionales")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Más sobre factura a crédito/i }),
    ).toBeInTheDocument();
  });

  it("submits invoice exchange rate and effective balance", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: /^Registrar pago$/i }));

    expect(mutateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        exchangeRate: 18.5,
        currency: "USD",
        amount: 1160,
      }),
    );
  });
});
