import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Invoice } from "@features/invoicing/domain";
import { tripQueryKeys, type Trip, type TripStop } from "@features/trips/domain";
import { TooltipProvider } from "@shared/ui/tooltip";
import { SubstituteInvoiceSheet } from "./SubstituteInvoiceSheet";

const { mutateMock, TRIP_ID, STOP_ID } = vi.hoisted(() => ({
  mutateMock: vi.fn(),
  TRIP_ID: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  STOP_ID: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
}));

vi.mock("@features/invoicing/application", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/invoicing/application")>();
  return {
    ...actual,
    useSubstituteStampedInvoice: () => ({
      mutate: mutateMock,
      isPending: false,
    }),
    useInvoiceLinkedTripsLoading: () => false,
    prefetchInvoiceLinkedTrips: vi.fn(
      async (
        queryClient: import("@tanstack/react-query").QueryClient,
        tripIds: string[],
      ) => {
        for (const tripId of tripIds) {
          if (!queryClient.getQueryData(tripQueryKeys.detail(tripId))) {
            queryClient.setQueryData(
              tripQueryKeys.detail(tripId),
              buildTripWithStop(),
            );
          }
        }
      },
    ),
  };
});

vi.mock("@features/trips/application/hooks/trip/useTrip", () => ({
  useTrip: (_tripId: string, options?: { enabled?: boolean }) => {
    if (options?.enabled === false) {
      return { data: undefined, isLoading: false, isError: false, error: null };
    }
    return {
      data: buildTripWithStop(),
      isLoading: false,
      isError: false,
      error: null,
    };
  },
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
  }),
}));

function buildInvoice(): Invoice {
  return {
    id: "inv-1",
    tenantId: "tenant-1",
    serie: "A",
    folio: 15,
    cfdiUuid: "c9b54a4b-c44f-4fd6-afeb-a6889f4ad073",
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
    trips: [
      {
        tripId: TRIP_ID,
        tripCode: "TRP-001",
        clientName: "Cliente",
        scheduledDeparture: "2026-06-01T08:00:00.000Z",
        originCity: "Monterrey",
        originState: "NL",
        destinationCity: "Saltillo",
        destinationState: "CO",
        baseRate: 1000,
        billingScope: "primary_transport",
      },
    ],
    concepts: [],
    payments: [],
    totalPaid: 0,
    balanceDue: 1160,
    canSubstituteInvoice: true,
    createdAt: "2026-06-01T12:00:00.000Z",
    updatedAt: "2026-06-01T12:05:00.000Z",
    createdBy: "user-1",
    updatedBy: "user-1",
    createdByName: "Admin",
    updatedByName: "Admin",
  };
}

function buildTripWithStop(): Trip {
  const stop: TripStop = {
    id: STOP_ID,
    tripId: TRIP_ID,
    sequenceOrder: 0,
    stopType: "origin",
    status: "pending",
    rfcRemitenteDestinatario: "OLDRFC123456",
    nombreRemitenteDestinatario: "Origen SA",
  } as unknown as TripStop;

  return {
    id: TRIP_ID,
    stops: [stop],
  } as Trip;
}

function renderSheet() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(tripQueryKeys.detail(TRIP_ID), buildTripWithStop());

  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SubstituteInvoiceSheet
          invoice={buildInvoice()}
          open
          onOpenChange={vi.fn()}
        />
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

describe("SubstituteInvoiceSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders operative header, intro and confirm without SAT codes in subtitle", () => {
    renderSheet();

    expect(
      screen.getByRole("heading", { name: "Sustituir factura" }),
    ).toBeInTheDocument();
    expect(screen.getByText("A-15 · Cliente Demo SA")).toBeInTheDocument();
    expect(
      screen.queryByText("Motivo SAT 01 — errores con relación"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Se emite una factura nueva/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Se cancela la factura A-15/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/no tiene pagos registrados/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Si no cambias nada abajo/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/¿Qué quieres corregir\? \(opcional\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Sustituir factura$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Detalle fiscal de la sustitución/i }),
    ).toBeInTheDocument();
  });

  it("prefetches linked trip and includes trip corrections on submit", async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.type(
      screen.getByLabelText(/Motivo de la corrección/i),
      "Corrección RFC parada origen",
    );

    await user.click(screen.getByRole("button", { name: /Paradas del viaje/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Corregir RFC/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Corregir RFC/i }));

    await user.clear(screen.getByLabelText(/RFC remitente/i));
    await user.type(screen.getByLabelText(/RFC remitente/i), "XAXX010101000");
    await user.type(
      screen.getByLabelText(/Motivo del cambio/i),
      "RFC incorrecto en parada",
    );

    await user.click(
      screen.getByRole("button", { name: /Incluir en sustitución/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Editar de nuevo/i }),
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: /^Sustituir factura$/i }),
    );

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalled();
    });

    const payload = mutateMock.mock.calls[0]?.[0];
    expect(payload.corrections?.tripCorrections?.length).toBeGreaterThan(0);
  });
});
