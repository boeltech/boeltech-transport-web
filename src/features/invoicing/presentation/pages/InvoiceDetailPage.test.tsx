import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  InvoiceStatusLabels,
  type Invoice,
} from "@features/invoicing/domain";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { invoicingCopy } from "../copy/invoicingCopy";
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

const mockHasPermission = vi.fn<(resource?: string, action?: string) => boolean>(
  () => false,
);
const mockUseRole = vi.fn(() => "accountant");

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: mockHasPermission,
  }),
  useRole: () => mockUseRole(),
}));

vi.mock("../components/InvoiceActions", () => ({
  InvoiceActions: (props: {
    openSendRequestKey?: number;
    openPaymentRequestKey?: number;
    openSubstituteRequestKey?: number;
    openCancelRequestKey?: number;
    openResumeCancelRequestKey?: number;
  }) => (
    <div
      data-testid="invoice-actions"
      data-open-send={String(props.openSendRequestKey ?? 0)}
      data-open-payment={String(props.openPaymentRequestKey ?? 0)}
      data-open-substitute={String(props.openSubstituteRequestKey ?? 0)}
      data-open-cancel={String(props.openCancelRequestKey ?? 0)}
      data-open-resume-cancel={String(props.openResumeCancelRequestKey ?? 0)}
    />
  ),
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

const useTripMock = vi.fn();
vi.mock("@features/trips/application", () => ({
  useTrip: (...args: unknown[]) => useTripMock(...args),
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
    activeReplacement: null,
    issuerRfc: "AAA010101AAA",
    issuerName: "Emisor",
    issuerTaxRegime: "601",
    issueLocation: "26015",
    receiverRfc: "XAXX010101000",
    receiverName: "Cliente",
    cfdiUsage: "S01",
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
    dispatchSentAt: null,
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
          <Route
            path="/invoices/:id/edit"
            element={<div data-testid="invoice-edit-page" />}
          />
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
    useTripMock.mockReturnValue({ data: undefined });
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

  it("shows above-the-fold banner when cancellation is waiting for the receiver", () => {
    mockUseRole.mockReturnValue("admin");
    useInvoiceMock.mockReturnValue({
      data: buildInvoice({ status: "cancellation_pending" }),
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchMock,
    });

    renderPage();

    // Badge + banner title share the same glossary string.
    expect(
      screen.getAllByText(
        invoicingCopy.detail.hint.cancellationPendingBannerTitle,
      ).length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      screen.getByText(invoicingCopy.detail.hint.cancellationPendingBannerBody),
    ).toBeInTheDocument();
  });

  it("shows Cancelada ante el SAT label when cancelled", () => {
    mockUseRole.mockReturnValue("admin");
    useInvoiceMock.mockReturnValue({
      data: buildInvoice({ status: "cancelled" }),
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchMock,
    });

    renderPage();

    expect(
      screen.getByText(InvoiceStatusLabels.cancelled),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        invoicingCopy.detail.hint.cancellationPendingBannerTitle,
      ),
    ).not.toBeInTheDocument();
  });

  it("accountant on stamped invoice sees stable SAT hole without trip banners", () => {
    mockUseRole.mockReturnValue("accountant");
    useInvoiceMock.mockReturnValue({
      data: buildInvoice({ status: "stamped" }),
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchMock,
    });

    renderPage();

    expect(
      screen.getByText(invoicingCopy.detail.hint.satHoleTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(invoicingCopy.detail.hint.satHoleBody),
    ).toBeInTheDocument();
  });

  it("shows PUE settled hint in balance stat when fully paid at stamp", () => {
    renderPage();

    // AmountsPanel is mocked in this suite; balance $0 comes from header stats.
    expect(screen.getByTestId("amounts-panel")).toBeInTheDocument();
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

  it("shows substitution alert for active substitute when original already cancelled", () => {
    useInvoiceMock.mockImplementation((id: string) => {
      if (id === "parent-inv-1") {
        return {
          data: buildInvoice({
            id: "parent-inv-1",
            status: "cancelled",
            parentInvoiceId: null,
          }),
          isLoading: false,
          isError: false,
          error: null,
          refetch: refetchMock,
        };
      }
      return {
        data: buildInvoice({ parentInvoiceId: "parent-inv-1", status: "stamped" }),
        isLoading: false,
        isError: false,
        error: null,
        refetch: refetchMock,
      };
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

  it("A-54: shows substitution-cancel-pending banner and hides mid-trip Sustituir", async () => {
    mockUseRole.mockReturnValue("manager");
    mockHasPermission.mockImplementation(
      (_module?: string, action?: string) =>
        action === "execute" || action === "read",
    );
    useTripMock.mockReturnValue({
      data: {
        requiresFiscalAttention: true,
        operationalOutcome: "completed",
        status: "in_progress",
      },
    });
    useInvoiceMock.mockReturnValue({
      data: buildInvoice({
        status: "stamped",
        canSubstituteInvoice: false,
        activeReplacement: {
          id: "inv-55",
          serie: "A",
          folio: 55,
          cfdiUuid: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        },
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

    const user = userEvent.setup();
    renderPage();

    expect(
      screen.getByText(
        invoicingCopy.detail.hint.substitutionCancelPendingTitle,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Revisión de facturación pendiente"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Sustituir$/i }),
    ).not.toBeInTheDocument();

    const resumeBtn = screen.getByRole("button", {
      name: invoicingCopy.detail.hint.substitutionCancelPendingCta,
    });
    expect(resumeBtn).toBeInTheDocument();
    const actions = screen.getByTestId("invoice-actions");
    expect(actions).toHaveAttribute("data-open-resume-cancel", "0");
    await user.click(resumeBtn);
    expect(actions).toHaveAttribute("data-open-resume-cancel", "1");
  });

  it("A-54 pending_receiver: resume cancel CTA syncs when original awaits receptor", async () => {
    mockUseRole.mockReturnValue("manager");
    mockHasPermission.mockImplementation(
      (_module?: string, action?: string) =>
        action === "execute" || action === "read",
    );
    useTripMock.mockReturnValue({
      data: {
        requiresFiscalAttention: false,
        operationalOutcome: "false_trip",
        status: "completed",
      },
    });
    useInvoiceMock.mockReturnValue({
      data: buildInvoice({
        status: "cancellation_pending",
        canCancelInvoice: true,
        canSubstituteInvoice: false,
        activeReplacement: {
          id: "inv-58",
          serie: "A",
          folio: 58,
          cfdiUuid: "6a0f148d-750b-516d-b7dc-d9b8c923a2b9",
        },
        trips: [
          {
            tripId: "trip-1",
            tripCode: "TRP-260927-0001",
            clientName: "INMOBILIARIA CVA",
            scheduledDeparture: "2026-09-27T12:00:00.000Z",
            baseRate: 28500,
            billingScope: "false_trip",
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

    const user = userEvent.setup();
    renderPage();

    expect(
      screen.getByText(
        invoicingCopy.detail.hint.substitutionCancelPendingTitle,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        invoicingCopy.detail.hint.cancellationPendingBannerBody,
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: invoicingCopy.detail.hint.cancellationPendingBannerCta,
      }),
    ).not.toBeInTheDocument();

    const resumeBtn = screen.getByRole("button", {
      name: invoicingCopy.detail.hint.substitutionCancelPendingCta,
    });
    const actions = screen.getByTestId("invoice-actions");
    await user.click(resumeBtn);
    expect(actions).toHaveAttribute("data-open-resume-cancel", "1");
  });

  it("A-55: orients to original and does not show mid-trip Sustituir", () => {
    mockUseRole.mockReturnValue("manager");
    useTripMock.mockReturnValue({
      data: {
        requiresFiscalAttention: true,
        operationalOutcome: "completed",
        status: "in_progress",
      },
    });
    useInvoiceMock.mockImplementation((id: string) => {
      if (id === "parent-inv-54") {
        return {
          data: buildInvoice({
            id: "parent-inv-54",
            status: "stamped",
            parentInvoiceId: null,
            activeReplacement: {
              id: "inv-1",
              serie: "A",
              folio: 55,
              cfdiUuid: null,
            },
          }),
          isLoading: false,
          isError: false,
          error: null,
          refetch: refetchMock,
        };
      }
      return {
        data: buildInvoice({
          id: "inv-1",
          parentInvoiceId: "parent-inv-54",
          status: "stamped",
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
      };
    });

    renderPage();

    expect(
      screen.getByText(
        invoicingCopy.detail.hint.substitutionCancelPendingTitle,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        invoicingCopy.detail.hint.substitutionCancelPendingBodySubstitute,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: invoicingCopy.detail.hint.substitutionCancelPendingLinkOriginal,
      }),
    ).toHaveAttribute("href", "/invoices/parent-inv-54");
    expect(
      screen.queryByText("Revisión de facturación pendiente"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Sustituir$/i }),
    ).not.toBeInTheDocument();
  });

  it("accountant with partial substitution sees ask-manager hole, not Sustituir/Cancelar CTA", () => {
    mockUseRole.mockReturnValue("accountant");
    useInvoiceMock.mockReturnValue({
      data: buildInvoice({
        status: "stamped",
        activeReplacement: {
          id: "inv-55",
          serie: "A",
          folio: 55,
          cfdiUuid: null,
        },
      }),
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchMock,
    });

    renderPage();

    expect(
      screen.getByText(
        invoicingCopy.detail.hint.substitutionCancelPendingTitle,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        invoicingCopy.detail.hint.substitutionCancelPendingAskManagerBody,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: invoicingCopy.detail.hint.substitutionCancelPendingCta,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(invoicingCopy.detail.hint.satHoleTitle),
    ).not.toBeInTheDocument();
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

  it("shows forbidden state on Axios 403", () => {
    useInvoiceMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      // Interceptor leaves 403 as Axios (not ApiError) for auth handling.
      error: {
        isAxiosError: true,
        response: { status: 403 },
        message: "Request failed with status code 403",
      },
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

  it("shows send follow-through without module links", () => {
    renderPage();

    expect(screen.getByText("Siguiente paso")).toBeInTheDocument();
    expect(
      screen.getByText(invoicingCopy.detail.hint.followThroughSend),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Ir a Envíos/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Ir a Cobros/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/complemento de pagos/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Cartera/i)).not.toBeInTheDocument();
  });

  it("manager follow-through usa el mismo copy llano de envío", () => {
    mockUseRole.mockReturnValue("manager");
    renderPage();

    expect(
      screen.getByText(invoicingCopy.detail.hint.followThroughSend),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Ir a Envíos/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Por facturar/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/emitir/i)).not.toBeInTheDocument();
  });

  it("follow-through Enviar en action incrementa openSendRequestKey del toolbar", async () => {
    const user = userEvent.setup();
    mockHasPermission.mockImplementation(
      (resource?: string, action?: string) =>
        resource === "invoices" && action === "execute",
    );
    renderPage();

    const actions = screen.getByTestId("invoice-actions");
    expect(actions).toHaveAttribute("data-open-send", "0");

    await user.click(
      screen.getByRole("button", {
        name: invoicingCopy.detail.actions.sendByEmail,
      }),
    );

    expect(actions).toHaveAttribute("data-open-send", "1");
  });

  it("follow-through Registrar pago en action incrementa openPaymentRequestKey", async () => {
    const user = userEvent.setup();
    mockHasPermission.mockImplementation(
      (resource?: string, action?: string) =>
        resource === "invoices" && action === "execute",
    );
    useInvoiceMock.mockReturnValue({
      data: buildInvoice({
        paymentMethod: "PPD",
        totalPaid: 0,
        balanceDue: 1160,
        dispatchSentAt: "2026-09-11T12:00:00.000Z",
      }),
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchMock,
    });

    renderPage();

    const actions = screen.getByTestId("invoice-actions");
    expect(actions).toHaveAttribute("data-open-payment", "0");

    await user.click(
      screen.getByRole("button", {
        name: invoicingCopy.detail.actions.registerPayment,
      }),
    );

    expect(actions).toHaveAttribute("data-open-payment", "1");
  });

  it("shows numbered checklist when send and collect are both pending", () => {
    useInvoiceMock.mockReturnValue({
      data: buildInvoice({
        paymentMethod: "PPD",
        totalPaid: 0,
        balanceDue: 1160,
        dispatchSentAt: null,
      }),
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchMock,
    });

    renderPage();

    expect(screen.getByText("Siguiente paso")).toBeInTheDocument();
    expect(
      screen.getByText(invoicingCopy.detail.hint.followThroughSendBoth),
    ).toBeInTheDocument();
    expect(
      screen.getByText(invoicingCopy.detail.hint.followThroughCollectBoth),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(invoicingCopy.detail.hint.followThroughSend),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Ir a Envíos/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Ir a Cobros/i })).not.toBeInTheDocument();
  });

  it("auto-dispatch failed: DetailAlertCard con Enviar y Ver este lote", async () => {
    const user = userEvent.setup();
    mockHasPermission.mockImplementation(
      (resource?: string, action?: string) =>
        resource === "invoices" && action === "execute",
    );
    useInvoiceMock.mockReturnValue({
      data: buildInvoice({
        dispatchSentAt: null,
        autoDispatch: {
          enabledForClient: true,
          lastScheduledRunId: "run-99",
          lastItemStatus: "failed",
          lastError: "smtp timeout",
        },
      }),
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchMock,
    });

    renderPage();

    expect(
      screen.getByText(invoicingCopy.send.autoDispatchFailedTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: invoicingCopy.send.autoDispatchFailedLink,
      }),
    ).toHaveAttribute("href", "/finance/dispatch/run-99");

    const actions = screen.getByTestId("invoice-actions");
    expect(actions).toHaveAttribute("data-open-send", "0");
    // Follow-through + auto-dispatch pueden mostrar ambos «Enviar»; cualquiera cablea el toolbar.
    const sendButtons = screen.getAllByRole("button", {
      name: invoicingCopy.detail.actions.sendByEmail,
    });
    expect(sendButtons.length).toBeGreaterThanOrEqual(1);
    await user.click(sendButtons[0]!);
    expect(actions).toHaveAttribute("data-open-send", "1");
  });

  it("shows fiscal attention banner with textual Sustituir link for manager", () => {
    mockUseRole.mockReturnValue("manager");
    useTripMock.mockReturnValue({
      data: {
        requiresFiscalAttention: true,
        operationalOutcome: "completed",
        status: "in_progress",
      },
    });
    useInvoiceMock.mockReturnValue({
      data: buildInvoice({
        canSubstituteInvoice: true,
        trips: [
          {
            tripId: "trip-1",
            tripCode: "TRP-260904-0004",
            clientName: "XENON",
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

    expect(
      screen.getByText("Revisión de facturación pendiente"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Sustituir$/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Sustituir factura$/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Atención fiscal")).toBeInTheDocument();
  });

  it("accountant with fiscal attention does not see Sustituir; asks a manager", () => {
    mockUseRole.mockReturnValue("accountant");
    useTripMock.mockReturnValue({
      data: {
        requiresFiscalAttention: true,
        operationalOutcome: "completed",
        status: "in_progress",
      },
    });
    useInvoiceMock.mockReturnValue({
      data: buildInvoice({
        canSubstituteInvoice: true,
        trips: [
          {
            tripId: "trip-1",
            tripCode: "TRP-260904-0004",
            clientName: "XENON",
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

    expect(
      screen.getByText("Revisión de facturación pendiente"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Sustituir$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Pide a un gerente cancelar o sustituir/i),
    ).toBeInTheDocument();
  });

  it("hides fiscal attention Sustituir banner for false_trip and shows cancel CFDI banner instead", () => {
    useTripMock.mockReturnValue({
      data: {
        requiresFiscalAttention: true,
        operationalOutcome: "false_trip",
        invoicing: {
          hasActivePrincipalInvoice: true,
          invoiceId: "inv-1",
          invoiceStatus: "stamped",
        },
      },
    });
    useInvoiceMock.mockReturnValue({
      data: buildInvoice({
        canCancelInvoice: true,
        totalPaid: 0,
        balanceDue: 1160,
        payments: [],
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

    expect(
      screen.queryByText("Revisión de facturación pendiente"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Sustituir$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Trámite SAT: pide a un gerente"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Cancelar$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Cancelar o sustituir esta factura lo hace un gerente/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Atención fiscal")).toBeInTheDocument();
  });

  it("hides false_trip cancel CFDI banner when principal is no longer active (#32)", () => {
    useTripMock.mockReturnValue({
      data: {
        requiresFiscalAttention: true,
        operationalOutcome: "false_trip",
        invoicing: {
          hasActivePrincipalInvoice: false,
          invoiceId: "inv-1",
          invoiceStatus: "cancelled",
        },
      },
    });
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

    expect(
      screen.queryByText("Cancela la factura de flete"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Atención fiscal")).not.toBeInTheDocument();
  });

  it("post-cancel + cobros: blocked notice + Ver pagos, nunca Sustituir", () => {
    useTripMock.mockReturnValue({
      data: {
        requiresFiscalAttention: true,
        operationalOutcome: "standard",
        status: "cancelled",
      },
    });
    useInvoiceMock.mockReturnValue({
      data: buildInvoice({
        canCancelInvoice: false,
        canSubstituteInvoice: true,
        totalPaid: 500,
        payments: [],
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

    expect(
      screen.getByText("No se puede cancelar con cobros"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Ver pagos$/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Sustituir$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Revisión de facturación pendiente"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Atención fiscal")).toBeInTheDocument();
  });

  it("post-cancel sin cobros: orienta a Cancelar (no Sustituir)", () => {
    useTripMock.mockReturnValue({
      data: {
        requiresFiscalAttention: true,
        operationalOutcome: "standard",
        status: "cancelled",
      },
    });
    useInvoiceMock.mockReturnValue({
      data: buildInvoice({
        canCancelInvoice: true,
        canSubstituteInvoice: true,
        totalPaid: 0,
        payments: [],
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

    expect(screen.getByText("Trámite SAT: pide a un gerente")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Cancelar$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Cancelar o sustituir esta factura lo hace un gerente/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Sustituir$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Revisión de facturación pendiente"),
    ).not.toBeInTheDocument();
  });

  it("cliente: labels Facturado y oculta badge de envío", () => {
    mockUseRole.mockReturnValue("client");
    renderPage();

    expect(screen.getByText("Facturado")).toBeInTheDocument();
    expect(screen.queryByText("Timbrada")).not.toBeInTheDocument();
    expect(screen.queryByText("Enviada")).not.toBeInTheDocument();
    expect(screen.queryByText("No enviada")).not.toBeInTheDocument();
  });

  it("cliente: Borrador muestra alerta de escala", () => {
    mockUseRole.mockReturnValue("client");
    useInvoiceMock.mockReturnValue({
      data: buildInvoice({
        status: "draft",
        cfdiUuid: null,
        hasStampedXml: false,
        stampedAt: null,
      }),
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchMock,
    });

    renderPage();

    expect(screen.getByText("Borrador")).toBeInTheDocument();
    expect(
      screen.getByText(invoicingCopy.detail.hint.clientDraftTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(invoicingCopy.detail.hint.clientDraftBody),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Timbrar$/i }),
    ).not.toBeInTheDocument();
  });

  it("cliente 403: no es tuya o pide vínculo; back a Mis facturas", () => {
    mockUseRole.mockReturnValue("client");
    useInvoiceMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: {
        isAxiosError: true,
        response: { status: 403 },
        message: "Request failed with status code 403",
      },
      refetch: refetchMock,
    });

    renderPage();

    expect(screen.getByText("Acceso denegado")).toBeInTheDocument();
    expect(
      screen.getByText(invoicingCopy.detail.forbidden.descriptionClient),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: invoicingCopy.detail.header.backToClientInvoices,
      }),
    ).toBeInTheDocument();
  });

  it("borrador XAXX con 626 / G03: alerta «Datos que el SAT rechazará» y «Corregir datos» abre la edición", async () => {
    const user = userEvent.setup();
    mockHasPermission.mockImplementation(
      (resource?: string, action?: string) =>
        resource === "invoices" && action === "update",
    );
    useInvoiceMock.mockReturnValue({
      data: buildInvoice({
        status: "draft",
        cfdiUuid: null,
        hasStampedXml: false,
        stampedAt: null,
        receiverTaxRegime: "626",
        cfdiUsage: "G03",
      }),
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchMock,
    });

    renderPage();

    expect(
      screen.getByText(invoicingCopy.genericReceiver.detailTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        invoicingCopy.genericReceiver.detailBody("national", "626", "G03"),
      ),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: invoicingCopy.genericReceiver.detailCta,
      }),
    );

    expect(screen.getByTestId("invoice-edit-page")).toBeInTheDocument();
  });

  it("sin permiso de edición muestra la alerta sin «Corregir datos»", () => {
    useInvoiceMock.mockReturnValue({
      data: buildInvoice({
        status: "draft",
        cfdiUuid: null,
        hasStampedXml: false,
        stampedAt: null,
        receiverTaxRegime: "626",
        cfdiUsage: "G03",
      }),
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchMock,
    });

    renderPage();

    expect(
      screen.getByText(invoicingCopy.genericReceiver.detailTitle),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: invoicingCopy.genericReceiver.detailCta,
      }),
    ).not.toBeInTheDocument();
  });

  it.each([
    ["borrador XAXX ya correcto", { receiverTaxRegime: "616", cfdiUsage: "S01" }],
    [
      "borrador con RFC normal",
      { receiverRfc: "CSA010101AB1", receiverTaxRegime: "626", cfdiUsage: "G03" },
    ],
  ])("%s: sin alerta de RFC genérico", (_label, overrides) => {
    useInvoiceMock.mockReturnValue({
      data: buildInvoice({
        status: "draft",
        cfdiUuid: null,
        hasStampedXml: false,
        stampedAt: null,
        ...overrides,
      }),
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchMock,
    });

    renderPage();

    expect(
      screen.queryByText(invoicingCopy.genericReceiver.detailTitle),
    ).not.toBeInTheDocument();
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
