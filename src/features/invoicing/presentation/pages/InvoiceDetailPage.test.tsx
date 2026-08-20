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

const mockHasPermission = vi.fn(() => false);
const mockUseRole = vi.fn(() => "accountant");

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: mockHasPermission,
  }),
  useRole: () => mockUseRole(),
}));

vi.mock("../components/InvoiceActions", () => ({
  InvoiceActions: () => <div data-testid="invoice-actions" />,
}));

vi.mock("../components/InvoiceDetailFiscalLabels", () => ({
  InvoiceDetailComprobanteCard: () => (
    <div data-testid="comprobante-card" />
  ),
  InvoiceDetailPaymentTermsCard: () => (
    <div data-testid="payment-terms-card" />
  ),
  InvoiceDetailAmountsPanel: () => (
    <div data-testid="amounts-panel" />
  ),
  InvoiceDetailFiscalDossierBody: () => (
    <div data-testid="fiscal-dossier-body" />
  ),
  InvoiceDetailIssuerReceiverCards: () => (
    <div data-testid="issuer-receiver-cards" />
  ),
  InvoiceDetailCfdiAmountsCard: () => (
    <div data-testid="cfdi-amounts-card" />
  ),
}));

vi.mock("../components/InvoiceDetailFiscalDossier", () => ({
  InvoiceDetailFiscalDossier: () => (
    <div data-testid="fiscal-dossier" />
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
    concepts: [],
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
    mockHasPermission.mockReturnValue(false);
    mockUseRole.mockReturnValue("accountant");
    refetchMock.mockResolvedValue(undefined);
    useInvoiceMock.mockReturnValue({
      data: buildInvoice(),
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchMock,
    });
  });

  it("passes pausePolling option to useInvoice", () => {
    renderPage();

    expect(useInvoiceMock).toHaveBeenCalledWith("inv-1", {
      pausePolling: false,
    });
  });

  it("shows PUE settled hint in balance stat when fully paid at stamp", () => {
    renderPage();

    expect(
      screen.getByText(/Se liquidó al emitir \(pago de contado\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText("$0.00")).toBeInTheDocument();
  });

  it("shows situation subtitle with client and issuer without UUID above the fold", () => {
    renderPage();

    expect(screen.getByText(/Cliente · XAXX010101000/i)).toBeInTheDocument();
    expect(screen.getByText(/Factura de Emisor/i)).toBeInTheDocument();
    expect(screen.queryByText(/c9b54a4b-c44f-4fd6-afeb-a6889f4ad073/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("fiscal-dossier")).toBeInTheDocument();
  });

  it("shows Flete badge for primary billing scope", () => {
    useInvoiceMock.mockReturnValue({
      data: buildInvoice({
        trips: [
          {
            tripId: "trip-1",
            tripCode: "V-1",
            clientName: "Cliente",
            scheduledDeparture: "2026-06-01T12:00:00.000Z",
            baseRate: 1000,
            billingScope: "primary_transport",
            originCity: "Mty",
            originState: "NL",
            destinationCity: "Gdl",
            destinationState: "JAL",
          },
        ],
      }),
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchMock,
    });

    renderPage();

    expect(screen.getAllByText("Flete").length).toBeGreaterThan(0);
  });

  it("shows substitution alert for active substitute with parentInvoiceId", () => {
    useInvoiceMock.mockReturnValue({
      data: buildInvoice({ parentInvoiceId: "parent-inv-1", status: "stamped" }),
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

  it("hides substitution alert when cancelled substitute still has parentInvoiceId", () => {
    useInvoiceMock.mockReturnValue({
      data: buildInvoice({
        parentInvoiceId: "parent-inv-1",
        status: "cancelled",
        hasStampedXml: false,
      }),
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchMock,
    });

    renderPage();

    expect(screen.queryByText(/Esta factura sustituye a/i)).not.toBeInTheDocument();
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
