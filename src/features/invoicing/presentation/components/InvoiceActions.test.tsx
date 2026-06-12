import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Invoice } from "@features/invoicing/domain";
import { InvoiceActions } from "./InvoiceActions";

const mockHasPermission = vi.fn();

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: mockHasPermission,
  }),
}));

vi.mock("@features/trips/presentation/components/trip-fiscal", () => ({
  useTripFiscalSheets: () => ({
    requestStamp: vi.fn(),
    isStamping: false,
    sheets: null,
  }),
}));

vi.mock("@features/invoicing/application", () => ({
  useDeleteInvoice: () => ({ mutate: vi.fn(), isPending: false }),
  useRegisterPayment: () => ({ mutate: vi.fn(), isPending: false }),
  useCancelInvoice: () => ({ mutate: vi.fn(), isPending: false }),
  useSubstituteStampedInvoice: () => ({ mutate: vi.fn(), isPending: false }),
  useOpenInvoicePdf: () => ({ mutate: vi.fn(), isPending: false }),
  downloadInvoiceXml: vi.fn(),
}));

function buildInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: "inv-1",
    tenantId: "tenant-1",
    serie: "A",
    folio: 100,
    cfdiUuid: "c9b54a4b-c44f-4fd6-afeb-a6889f4ad073",
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
    paymentForm: "03",
    paymentMethod: "PUE",
    currency: "MXN",
    exchangeRate: 1,
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
    xmlContent: "<xml/>",
    hasStampedXml: true,
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

function renderActions(invoice: Invoice) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <InvoiceActions
          variant="buttons"
          invoiceId={invoice.id}
          invoiceSerie={invoice.serie}
          invoiceFolio={invoice.folio}
          invoiceStatus={invoice.status}
          fullInvoice={invoice}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("InvoiceActions register payment visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockImplementation(
      (_module: string, action: string) => action === "create" || action === "delete",
    );
  });

  it("hides Registrar pago for stamped PUE even with pending raw balance", () => {
    renderActions(buildInvoice());

    expect(
      screen.queryByRole("button", { name: /Registrar pago/i }),
    ).not.toBeInTheDocument();
  });

  it("shows Registrar pago for stamped PPD with balance", () => {
    renderActions(
      buildInvoice({
        paymentMethod: "PPD",
        balanceDue: 660,
        totalPaid: 500,
      }),
    );

    expect(
      screen.getByRole("button", { name: /Registrar pago/i }),
    ).toBeInTheDocument();
  });

  it("hides Registrar pago for stamped PPD without balance", () => {
    renderActions(
      buildInvoice({
        paymentMethod: "PPD",
        balanceDue: 0,
        totalPaid: 1160,
      }),
    );

    expect(
      screen.queryByRole("button", { name: /Registrar pago/i }),
    ).not.toBeInTheDocument();
  });
});

describe("InvoiceActions RBAC execute/delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("manager with execute sees Cancelar and Sustituir but not Eliminar borrador", () => {
    mockHasPermission.mockImplementation(
      (_module: string, action: string) =>
        action === "execute" || action === "export",
    );

    renderActions(
      buildInvoice({
        status: "stamped",
        canSubstituteInvoice: true,
      }),
    );

    expect(
      screen.getByRole("button", { name: /Cancelar/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Sustituir factura/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Eliminar borrador/i }),
    ).not.toBeInTheDocument();
  });

  it("user with delete but not execute does not see Cancelar on stamped invoice", () => {
    mockHasPermission.mockImplementation(
      (_module: string, action: string) => action === "delete",
    );

    renderActions(buildInvoice({ status: "stamped" }));

    expect(
      screen.queryByRole("button", { name: /Cancelar/i }),
    ).not.toBeInTheDocument();
  });

  it("user with delete sees Eliminar borrador on draft", () => {
    mockHasPermission.mockImplementation(
      (_module: string, action: string) => action === "delete",
    );

    renderActions(buildInvoice({ status: "draft", cfdiUuid: null }));

    expect(
      screen.getByRole("button", { name: /Eliminar borrador/i }),
    ).toBeInTheDocument();
  });
});
