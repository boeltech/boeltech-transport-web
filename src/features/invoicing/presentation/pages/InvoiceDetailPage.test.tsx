import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Invoice } from "@features/invoicing/domain";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { InvoiceDetailPage } from "./InvoiceDetailPage";

const useInvoiceMock = vi.fn();
const refetchMock = vi.fn();
const retryRepMock = vi.fn();

vi.mock("@features/invoicing/application", () => ({
  useInvoice: (...args: unknown[]) => useInvoiceMock(...args),
  useRetryRepStamp: () => ({
    mutate: retryRepMock,
    isPending: false,
  }),
}));

vi.mock("../components/InvoiceActions", () => ({
  InvoiceActions: () => <div data-testid="invoice-actions" />,
}));

vi.mock("../components/InvoiceDetailFiscalLabels", () => ({
  InvoiceDetailIssuerReceiverCards: () => (
    <div data-testid="issuer-receiver-cards" />
  ),
  InvoiceDetailCfdiAmountsCard: () => (
    <div data-testid="cfdi-amounts-card" />
  ),
}));

vi.mock("@features/trips", () => ({
  TripListRouteLabel: () => <span data-testid="trip-route-label" />,
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
    xmlContent: null,
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
    totalPaid: 1160,
    balanceDue: 0,
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

function renderPage(
  invoiceId = "inv-1",
  locationState?: { from?: string },
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        initialEntries={[
          {
            pathname: `/invoices/${invoiceId}`,
            state: locationState,
          },
        ]}
      >
        <Routes>
          <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("InvoiceDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    refetchMock.mockResolvedValue(undefined);
    useInvoiceMock.mockReturnValue({
      data: buildInvoice(),
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchMock,
    });
  });

  it("shows PUE settled hint in balance stat when fully paid at stamp", () => {
    renderPage();

    expect(
      screen.getByText(/Liquidada al timbrar \(PUE/i),
    ).toBeInTheDocument();
    expect(screen.getByText("$0.00")).toBeInTheDocument();
  });

  it("shows substitution alert when parentInvoiceId is set", () => {
    useInvoiceMock.mockReturnValue({
      data: buildInvoice({ parentInvoiceId: "parent-inv-1" }),
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchMock,
    });

    renderPage();

    expect(
      screen.getByText(/Esta factura sustituye a/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /la factura original/i })).toHaveAttribute(
      "href",
      "/invoices/parent-inv-1",
    );
  });

  it("shows forbidden state on 403", () => {
    useInvoiceMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new ApiError("Forbidden", 403),
      refetch: refetchMock,
    });

    renderPage();

    expect(screen.getByText("Acceso denegado")).toBeInTheDocument();
    expect(
      screen.getByText("No tienes permiso para ver esta factura."),
    ).toBeInTheDocument();
  });

  it("shows not found state on 404", () => {
    useInvoiceMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new ApiError("Not found", 404),
      refetch: refetchMock,
    });

    renderPage();

    expect(screen.getByText("Factura no encontrada")).toBeInTheDocument();
  });

  it("retries load on server error", async () => {
    const user = userEvent.setup();
    useInvoiceMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new ApiError("Server error", 500),
      refetch: refetchMock,
    });

    renderPage();

    await user.click(screen.getByRole("button", { name: /Reintentar/i }));

    expect(refetchMock).toHaveBeenCalled();
  });
});
