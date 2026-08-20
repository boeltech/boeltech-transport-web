import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@shared/ui/tooltip";
import type { Invoice } from "@features/invoicing/domain";
import { InvoiceActions } from "./InvoiceActions";
import { invoicingCopy } from "../copy/invoicingCopy";

const mockHasPermission = vi.fn();
const mockUseRole = vi.fn(() => "accountant");
const fiscalSheetsMock = {
  requestStamp: vi.fn(),
  isStamping: false,
  isStampBusy: false,
  sheets: null as null,
};

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: mockHasPermission,
  }),
  useRole: () => mockUseRole(),
}));

vi.mock("@features/trips/presentation/components/trip-fiscal", () => ({
  useTripFiscalSheets: () => fiscalSheetsMock,
  describeStampApiError: (error: unknown) =>
    error instanceof Error ? error.message : String(error),
}));

vi.mock("@features/invoicing/application", () => ({
  useDeleteInvoice: () => ({ mutate: vi.fn(), isPending: false }),
  useRegisterPayment: () => ({ mutate: vi.fn(), isPending: false }),
  useCancelInvoice: () => ({ mutate: vi.fn(), isPending: false }),
  useSubstituteStampedInvoice: () => ({ mutate: vi.fn(), isPending: false }),
  useOpenInvoicePdf: () => ({ mutate: vi.fn(), isPending: false }),
  downloadInvoiceXml: vi.fn(),
}));

const mockUseTrip = vi.fn(() => ({
  data: undefined as { operationalOutcome?: string } | undefined,
}));

vi.mock("@features/trips/application", () => ({
  useTrip: (...args: unknown[]) => mockUseTrip(...args),
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

function renderActions(invoice: Invoice) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={0}>
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
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

describe("InvoiceActions register payment visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fiscalSheetsMock.isStamping = false;
    fiscalSheetsMock.isStampBusy = false;
    mockUseRole.mockReturnValue("accountant");
    mockHasPermission.mockImplementation(
      (_module: string, action: string) =>
        action === "execute" || action === "delete",
    );
    mockUseTrip.mockReturnValue({ data: undefined });
  });

  it("hides Registrar pago for stamped PUE even with pending raw balance", () => {
    renderActions(buildInvoice());

    expect(
      screen.queryByRole("button", { name: /Registrar pago/i }),
    ).not.toBeInTheDocument();
  });

  it("shows Registrar pago for stamped PPD with balance when execute", () => {
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

  it("hides Registrar pago when only create (not execute)", () => {
    mockHasPermission.mockImplementation(
      (_module: string, action: string) => action === "create",
    );

    renderActions(
      buildInvoice({
        paymentMethod: "PPD",
        balanceDue: 660,
        totalPaid: 500,
      }),
    );

    expect(
      screen.queryByRole("button", { name: /Registrar pago/i }),
    ).not.toBeInTheDocument();
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
    fiscalSheetsMock.isStamping = false;
    fiscalSheetsMock.isStampBusy = false;
    mockUseRole.mockReturnValue("manager");
    mockUseTrip.mockReturnValue({ data: undefined });
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

  it("accountant with execute does not see Cancelar or Sustituir", () => {
    mockUseRole.mockReturnValue("accountant");
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
      screen.queryByRole("button", { name: /Cancelar/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Sustituir factura/i }),
    ).not.toBeInTheDocument();
  });

  it("hides Sustituir on stamped freight CFDI when the trip is false_trip", () => {
    mockHasPermission.mockImplementation(
      (_module: string, action: string) =>
        action === "execute" || action === "export",
    );
    mockUseTrip.mockReturnValue({
      data: { operationalOutcome: "false_trip" },
    });

    renderActions(
      buildInvoice({
        status: "stamped",
        canSubstituteInvoice: true,
        trips: [
          {
            tripId: "trip-1",
            tripCode: "V-1",
            clientName: "Cliente",
            scheduledDeparture: "2026-06-01T12:00:00.000Z",
            originCity: "QRO",
            originState: "QRO",
            destinationCity: "CDMX",
            destinationState: "CMX",
            baseRate: 1000,
            billingScope: "primary_transport",
          },
        ],
      }),
    );

    expect(
      screen.getByRole("button", { name: /Cancelar/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Sustituir factura/i }),
    ).not.toBeInTheDocument();
  });

  it("manager with cobros sees Sustituir disabled instead of hiding it", async () => {
    mockHasPermission.mockImplementation(
      (_module: string, action: string) =>
        action === "execute" || action === "export",
    );

    renderActions(
      buildInvoice({
        status: "stamped",
        paymentMethod: "PPD",
        canSubstituteInvoice: false,
        totalPaid: 500,
        balanceDue: 660,
        payments: [
          {
            id: "pay-1",
            invoiceId: "inv-1",
            amount: 500,
            currency: "MXN",
            exchangeRate: 1,
            amountMxn: 500,
            paymentDate: "2026-06-02",
            paymentTime: "12:00:00",
            paymentForm: "03",
            paymentFormName: null,
            reference: null,
            notes: null,
            createdAt: "2026-06-02T12:00:00.000Z",
            createdByName: null,
            repCfdiUuid: null,
            repStampedAt: null,
            repStatus: "pending",
            repAttempts: 1,
            repLastError: null,
            hasRepXml: false,
            repNumParcialidad: 1,
            repImpSaldoAnt: null,
            repImpSaldoInsoluto: null,
            repImpPagado: null,
          },
        ],
      }),
    );

    const user = userEvent.setup();
    const substitute = screen.getByRole("button", {
      name: invoicingCopy.detail.actions.substituteBlockedTitle,
    });

    expect(substitute).toBeDisabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await user.hover(substitute.parentElement!);
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      invoicingCopy.detail.actions.substituteBlocked,
    );
    expect(
      screen.getByRole("button", { name: /Cancelar/i }),
    ).toBeInTheDocument();
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

  it("Timbrar requires invoices.create and invoices.execute", () => {
    mockHasPermission.mockImplementation(
      (_module: string, action: string) => action === "create",
    );

    renderActions(buildInvoice({ status: "draft", cfdiUuid: null }));

    expect(
      screen.queryByRole("button", { name: /Timbrar/i }),
    ).not.toBeInTheDocument();

    mockHasPermission.mockImplementation(
      (_module: string, action: string) =>
        action === "create" || action === "execute",
    );

    renderActions(buildInvoice({ status: "draft", cfdiUuid: null }));

    expect(
      screen.getByRole("button", { name: /Timbrar/i }),
    ).toBeInTheDocument();
  });

  it("disables Timbrar while stamp flow is busy (preflight/prepare)", () => {
    mockHasPermission.mockImplementation(
      (_module: string, action: string) =>
        action === "create" || action === "execute",
    );
    fiscalSheetsMock.isStampBusy = true;
    fiscalSheetsMock.isStamping = false;

    renderActions(buildInvoice({ status: "draft", cfdiUuid: null }));

    expect(screen.getByRole("button", { name: /Timbrar/i })).toBeDisabled();
  });
});

describe("InvoiceActions portal client export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fiscalSheetsMock.isStamping = false;
    fiscalSheetsMock.isStampBusy = false;
    mockUseRole.mockReturnValue("client");
    mockHasPermission.mockImplementation(
      (_module: string, action: string) => action === "read",
    );
    mockUseTrip.mockReturnValue({ data: undefined });
  });

  it("client with invoices.read sees PDF/XML without invoices.export", () => {
    renderActions(buildInvoice({ status: "stamped", hasStampedXml: true }));

    expect(
      screen.getByRole("button", { name: /Descargar PDF/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Descargar XML/i }),
    ).toBeInTheDocument();
  });

  it("staff without export does not see PDF/XML", () => {
    mockUseRole.mockReturnValue("dispatcher");
    mockHasPermission.mockImplementation(
      (_module: string, action: string) => action === "read",
    );

    renderActions(buildInvoice({ status: "stamped", hasStampedXml: true }));

    expect(
      screen.queryByRole("button", { name: /Descargar PDF/i }),
    ).not.toBeInTheDocument();
  });
});
