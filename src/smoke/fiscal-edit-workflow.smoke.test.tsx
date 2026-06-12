/**
 * Smoke WS-G — flujo edición fiscal post-cierre (timbrar → corregir RFC → retimbrar).
 * Mock de API; no requiere backend ni Playwright.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Invoice } from "@features/invoicing/domain";
import { InvoiceActions } from "@features/invoicing/presentation/components/InvoiceActions";
import { TripStatus, type Trip, type TripStop } from "@features/trips/domain";
import { ApiError } from "@shared/api/interceptors/error-handler";

const TRIP_ID = "trip-smoke-1";
const STOP_ID = "stop-smoke-1";
const INVOICE_ID = "inv-smoke-1";

const mockStamp = vi.fn();
const mockPatchFiscal = vi.fn();
const mockFindTripById = vi.fn();
const mockToast = vi.fn();

type ToastPayload = {
  variant?: string;
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
};

let lastDestructiveToast: ToastPayload | undefined;

vi.mock("@features/invoicing/infrastructure", () => ({
  invoicingApi: {
    stamp: (...args: unknown[]) => mockStamp(...args),
    delete: vi.fn(),
    getById: vi.fn(),
    getAll: vi.fn(),
    getPayments: vi.fn(),
    getPrefillFromTrip: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    cancel: vi.fn(),
    substituteStamped: vi.fn(),
    createPayment: vi.fn(),
    openPdf: vi.fn(),
    downloadXml: vi.fn(),
  },
}));

vi.mock("@features/trips/infrastructure", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@features/trips/infrastructure")
  >();
  return {
    ...actual,
    tripRepository: {
      ...actual.tripRepository,
      findById: (...args: unknown[]) => mockFindTripById(...args),
    },
  };
});

vi.mock("@features/trips/infrastructure/tripStopFiscalApi", () => ({
  tripStopFiscalApi: {
    patch: (...args: unknown[]) => mockPatchFiscal(...args),
  },
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
    isLoading: false,
    isAuthenticated: true,
    role: "admin",
  }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({
      toast: (payload: ToastPayload) => {
        mockToast(payload);
        if (payload.variant === "destructive") {
          lastDestructiveToast = payload;
        }
      },
    }),
  };
});

const STOP_DEFAULTS = {
  tenantId: "tenant-smoke",
  tripId: TRIP_ID,
  addressId: "addr-1",
  clientId: "client-1",
  address: "Av. Principal 100",
  city: "Monterrey",
  state: "NL",
  postalCode: "64000",
  latitude: null,
  longitude: null,
  locationName: "Destino Demo",
  contactName: null,
  contactPhone: null,
  estimatedArrival: null,
  actualArrival: null,
  estimatedDeparture: null,
  actualDeparture: null,
  status: "completed" as const,
  notes: null,
  idUbicacion: null,
  street: null,
  exteriorNumber: null,
  interiorNumber: null,
  colonia: null,
  reference: null,
  satCountryCode: null,
  satEstadoCode: null,
  satMunicipioCode: null,
  satLocalidadCode: null,
  satColoniaCode: null,
  nombreRemitenteDestinatario: "Cliente Demo",
  deliveryRfcRemitenteDestinatario: null,
  deliveryNombreRemitenteDestinatario: null,
  remitentePartnerId: null,
  destinatarioPartnerId: null,
  distanceFromPreviousKm: 120,
  distanceSource: "manual" as const,
  distanceProvider: null,
  distanceConfidence: null,
  distanceComputedAt: null,
  createdAt: new Date("2026-06-01T10:00:00.000Z"),
  updatedAt: new Date("2026-06-01T10:00:00.000Z"),
} as const;

function createStop(
  overrides: Partial<TripStop> & Pick<TripStop, "id" | "sequenceOrder" | "stopType">,
): TripStop {
  return { ...STOP_DEFAULTS, ...overrides } as TripStop;
}

function createTrip(stops: TripStop[]): Trip {
  return {
    id: TRIP_ID,
    tenantId: "tenant-smoke",
    tripCode: "V-SMOKE-001",
    vehicleId: "veh-1",
    driverId: "drv-1",
    clientId: "client-1",
    scheduledDeparture: new Date("2026-06-01T08:00:00.000Z"),
    scheduledArrival: new Date("2026-06-01T18:00:00.000Z"),
    actualDeparture: new Date("2026-06-01T08:30:00.000Z"),
    actualArrival: new Date("2026-06-01T17:45:00.000Z"),
    mileage: { start: 1000, end: 1120 },
    originCity: "Monterrey",
    originState: "NL",
    destinationCity: "Saltillo",
    destinationState: "COAH",
    cargo: { description: "Carga demo", weight: 1000, volume: null },
    costs: {
      fuel: 0,
      tolls: 0,
      maintenance: 0,
      driver: 0,
      other: 0,
      total: 0,
    },
    detailedCosts: null,
    profitability: null,
    status: TripStatus.COMPLETED,
    notes: null,
    cancellationReason: null,
    invoicing: {
      hasActiveInvoice: true,
      canGenerateInvoice: false,
      invoiceId: INVOICE_ID,
      invoiceFolio: "A-100",
      invoiceCfdiUuid: null,
      invoiceStatus: "draft",
      blockReason: null,
    },
    requiresFiscalAttention: true,
    fiscalActionRequired: null,
    totalDistRec: 120,
    idCcp: null,
    cfdiDocumentIntent: "ingreso",
    createdAt: new Date("2026-06-01T07:00:00.000Z"),
    updatedAt: new Date("2026-06-01T18:00:00.000Z"),
    createdBy: "user-1",
    updatedBy: "user-1",
    createdByName: "Admin Demo",
    updatedByName: "Admin Demo",
    stops,
  } as Trip;
}

function createInvoice(): Invoice {
  return {
    id: INVOICE_ID,
    tenantId: "tenant-smoke",
    serie: "A",
    folio: 100,
    cfdiUuid: null,
    invoiceType: "ingreso",
    parentInvoiceId: null,
    issuerRfc: "AAA010101AAA",
    issuerName: "Transporte Demo",
    issuerTaxRegime: "601",
    issueLocation: "64000",
    receiverRfc: "XAXX010101000",
    receiverName: "Cliente Demo",
    cfdiUsage: "G03",
    receiverTaxRegime: "601",
    receiverPostalCode: "64000",
    issuedAt: "2026-06-01T18:00:00.000Z",
    paymentForm: "03",
    paymentMethod: "PUE",
    currency: "MXN",
    exchangeRate: 1,
    subtotal: 1000,
    discount: 0,
    totalTax: 160,
    retainedTax: 0,
    total: 1160,
    status: "draft",
    satCancellationStatus: "none",
    satCancellationMessage: null,
    satCancellationUpdatedAt: null,
    pacProvider: null,
    xmlContent: null,
    hasStampedXml: false,
    qrCode: null,
    pdfUrl: null,
    stampedAt: null,
    cancelledAt: null,
    cancellationReason: null,
    cancellationCode: null,
    replacementCfdiUuid: null,
    notes: null,
    trips: [
      {
        tripId: TRIP_ID,
        tripCode: "V-SMOKE-001",
        clientName: "Cliente Demo",
        scheduledDeparture: "2026-06-01T08:00:00.000Z",
        routeSummary: "Monterrey → Saltillo",
      },
    ],
    payments: [],
    totalPaid: 0,
    balanceDue: 1160,
    createdAt: "2026-06-01T18:00:00.000Z",
    updatedAt: "2026-06-01T18:00:00.000Z",
    createdBy: "user-1",
    updatedBy: "user-1",
    createdByName: "Admin Demo",
    updatedByName: "Admin Demo",
  } as Invoice;
}

function renderInvoiceActions(trip: Trip) {
  mockFindTripById.mockResolvedValue({ data: trip });

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/invoices/${INVOICE_ID}`]}>
        <InvoiceActions
          variant="buttons"
          invoiceId={INVOICE_ID}
          invoiceSerie="A"
          invoiceFolio={100}
          invoiceStatus="draft"
          fullInvoice={createInvoice()}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("smoke fiscal-edit workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastDestructiveToast = undefined;

    let stampAttempts = 0;
    mockStamp.mockImplementation(async () => {
      stampAttempts += 1;
      if (stampAttempts === 1) {
        throw new ApiError(
          "RFC inválido en parada #2",
          422,
          "INVALID_RFC_AT_STOP",
          {
            stopId: STOP_ID,
            currentRfc: "CRN140902QW3",
            stopOrder: 2,
          },
        );
      }
      return createInvoice();
    });

    mockPatchFiscal.mockImplementation(async () => {
      const updatedStop = createStop({
        id: STOP_ID,
        sequenceOrder: 2,
        stopType: ["destination"],
        clientAddressId: "client-addr-1",
        rfcRemitenteDestinatario: "XAXX010101000",
      });
      return {
        stop: updatedStop,
        clientUpdated: true,
        message: "Datos fiscales actualizados",
      };
    });
  });

  it("stamps draft invoice, surfaces INVALID_RFC_AT_STOP, fixes RFC, and auto re-stamps", async () => {
    const user = userEvent.setup();
    const trip = createTrip([
      createStop({
        id: "stop-origin",
        sequenceOrder: 1,
        stopType: ["origin"],
        rfcRemitenteDestinatario: "AAA010101AAA",
      }),
      createStop({
        id: STOP_ID,
        sequenceOrder: 2,
        stopType: ["destination"],
        clientAddressId: "client-addr-1",
        rfcRemitenteDestinatario: "CRN140902QW3",
      }),
    ]);

    renderInvoiceActions(trip);

    const stampButton = screen.getByRole("button", { name: "Timbrar" });
    expect(stampButton).toBeInTheDocument();

    await user.click(stampButton);

    await waitFor(() => {
      expect(mockStamp).toHaveBeenCalledTimes(1);
      expect(mockStamp).toHaveBeenCalledWith(INVOICE_ID);
    });

    await waitFor(() => {
      expect(lastDestructiveToast?.title).toBe("Error al timbrar");
      expect(lastDestructiveToast?.action?.label).toBe("Corregir RFC");
    });

    lastDestructiveToast?.action?.onClick();

    expect(
      await screen.findByRole("heading", { name: "Corregir RFC de parada" }),
    ).toBeInTheDocument();

    const rfcInput = screen.getByLabelText("RFC remitente/destinatario");
    await user.clear(rfcInput);
    await user.type(rfcInput, "XAXX010101000");

    const reasonInput = screen.getByLabelText("Razón del cambio");
    await user.type(reasonInput, "RFC rechazado por el PAC");

    const propagateCheckbox = screen.getByRole("checkbox", {
      name: "También actualizar el RFC en la dirección guardada del cliente",
    });
    await user.click(propagateCheckbox);

    await user.click(
      screen.getByRole("button", { name: "Validar y retimbrar" }),
    );

    await waitFor(() => {
      expect(mockPatchFiscal).toHaveBeenCalledWith(TRIP_ID, STOP_ID, {
        rfcRemitenteDestinatario: "XAXX010101000",
        nombreRemitenteDestinatario: "Cliente Demo",
        reason: "RFC rechazado por el PAC",
        propagateToClient: true,
      });
    });

    await waitFor(() => {
      expect(mockStamp).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "success",
          title: "Factura timbrada exitosamente",
        }),
      );
    });
  });

  it("opens picker with all stops when PAC error has no stopId and RFCs pass format", async () => {
    const user = userEvent.setup();
    mockStamp.mockReset();
    mockStamp.mockRejectedValueOnce(
      new ApiError(
        "RFC inválido en una parada del viaje",
        422,
        "INVALID_RFC_AT_STOP",
        { stopId: null, currentRfc: "XAXX010101000", stopOrder: null },
      ),
    );

    const trip = createTrip([
      createStop({
        id: "stop-origin",
        sequenceOrder: 1,
        stopType: ["origin"],
        rfcRemitenteDestinatario: "AAA010101AAA",
      }),
      createStop({
        id: STOP_ID,
        sequenceOrder: 2,
        stopType: ["destination"],
        clientAddressId: "client-addr-1",
        rfcRemitenteDestinatario: "XAXX010101000",
      }),
    ]);

    renderInvoiceActions(trip);

    await user.click(screen.getByRole("button", { name: "Timbrar" }));

    expect(
      await screen.findByText(
        "El PAC rechazó el timbrado, pero no se identificó la parada automáticamente. Revisa el RFC de cada parada y corrige la que corresponda.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Parada #1")).toBeInTheDocument();
    expect(screen.getByText("Parada #2")).toBeInTheDocument();
  });

  it("blocks stamp when preflight detects invalid RFC format", async () => {
    const user = userEvent.setup();
    const trip = createTrip([
      createStop({
        id: STOP_ID,
        sequenceOrder: 2,
        stopType: ["destination"],
        clientAddressId: "client-addr-1",
        rfcRemitenteDestinatario: "RFC-MALO",
      }),
    ]);

    renderInvoiceActions(trip);

    await user.click(screen.getByRole("button", { name: "Timbrar" }));

    expect(
      await screen.findByRole("heading", {
        name: "Revisa el RFC de las paradas",
      }),
    ).toBeInTheDocument();

    expect(mockStamp).not.toHaveBeenCalled();
  });
});
