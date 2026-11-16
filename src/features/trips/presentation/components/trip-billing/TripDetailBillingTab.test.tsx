import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { Trip, TripRevenueSplit } from "@features/trips/domain";
import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";
import { billingCopy } from "../../copy/tripDetail/billingCopy";
import { TripDetailBillingTab } from "./TripDetailBillingTab";

vi.mock("../trip-fleet-snapshot", () => ({
  TripFleetSnapshotCard: () => (
    <div data-testid="trip-fleet-snapshot-card-stub" />
  ),
}));

vi.mock("@features/invoicing/application", () => ({
  useInvoice: () => ({ data: undefined }),
  buildInvoiceCreateHref: () => "/invoices/new",
}));

vi.mock("@features/trips/application", () => ({
  useOperationalCashReceipts: () => ({
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
  }),
}));

function baseTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: "trip-1",
    tripCode: "TLX-1",
    tenantId: "t1",
    vehicleId: "v1",
    driverId: "d1",
    clientId: "c1",
    originBranchId: null,
    scheduledDeparture: new Date("2026-11-12T12:00:00Z"),
    scheduledArrival: new Date("2026-11-12T20:00:00Z"),
    actualDeparture: null,
    actualArrival: null,
    mileage: { start: null, end: null },
    originCity: "Monterrey",
    originState: "NL",
    destinationCity: "Saltillo",
    destinationState: "COAH",
    cargo: {
      description: null,
      weight: null,
      volume: null,
      units: null,
      value: null,
    },
    costs: {
      baseRate: 18500,
      fuelCost: 0,
      tollCost: 0,
      otherCosts: 0,
      totalCost: 0,
    },
    detailedCosts: null,
    profitability: null,
    status: "in_progress",
    operationalOutcome: "standard",
    falseTripDeclaredAt: null,
    falseTripDeclaredBy: null,
    notes: null,
    cancellationReason: null,
    invoicing: tripInvoicingFixture({
      invoiceId: "inv-1",
      invoiceFolio: "F-1",
      invoiceStatus: "stamped",
      hasActiveInvoice: true,
      hasActivePrimaryInvoice: true,
      hasActivePrincipalInvoice: true,
      cartaPorteAttached: true,
    }),
    requiresFiscalAttention: false,
    requiresFiscalAttentionAt: null,
    fiscalAttention: null,
    fiscalActionRequired: null,
    totalDistRec: null,
    idCcp: null,
    cfdiDocumentIntent: "ingreso",
    cfdiEmissionIntent: "emitir_cfdi",
    operationalCashCollectedAt: null,
    operationalCashAmount: null,
    operationalCashNote: null,
    operationalCash: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
    updatedBy: null,
    ...overrides,
  } as Trip;
}

function renderTab(
  trip: Trip,
  revenueSplit?: TripRevenueSplit | null,
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <TripDetailBillingTab
          trip={trip}
          canSubstituteInvoice
          revenueSplit={revenueSplit}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function activeSplitFixture(): TripRevenueSplit {
  return {
    id: "split-1",
    tripId: "trip-1",
    status: "active",
    basisAmount: 28500,
    currency: "MXN",
    notes: null,
    createdAt: "2026-11-12T10:00:00Z",
    updatedAt: "2026-11-12T10:00:00Z",
    legs: [
      {
        id: "leg-a",
        clientId: "c1",
        clientLegalName: "Cliente A",
        clientRfc: "AAA010101AAA",
        sharePercent: 60,
        sortOrder: 0,
        suggestedCartaPorte: true,
        invoiceId: "inv-a",
      },
      {
        id: "leg-b",
        clientId: "c2",
        clientLegalName: "Cliente B",
        clientRfc: "BBB010101BBB",
        sharePercent: 40,
        sortOrder: 1,
        suggestedCartaPorte: false,
        invoiceId: null,
      },
    ],
  };
}

describe("TripDetailBillingTab (F5)", () => {
  it("muestra hogar Facturación con facturas y sin placeholder", () => {
    renderTab(baseTrip());
    expect(screen.getByTestId("trip-billing-tab")).toBeInTheDocument();
    expect(screen.getByText(billingCopy.invoices.title)).toBeInTheDocument();
    expect(
      screen.queryByTestId("trip-billing-tab-placeholder"),
    ).not.toBeInTheDocument();
  });

  it("Sin factura → panel Cobro (Q11)", () => {
    renderTab(
      baseTrip({
        cfdiEmissionIntent: "sin_cfdi_efectivo",
        invoicing: tripInvoicingFixture(),
      }),
    );
    expect(screen.getByTestId("trip-billing-sin-cfdi-cobro")).toBeInTheDocument();
    expect(screen.getByText(billingCopy.sinCfdi.tableTitle)).toBeInTheDocument();
  });

  it("solo traslado: sin documentos (D24)", () => {
    renderTab(baseTrip({ cfdiDocumentIntent: "traslado" }));
    expect(screen.getByTestId("trip-billing-traslado")).toBeInTheDocument();
    expect(screen.getByText(billingCopy.traslado.title)).toBeInTheDocument();
  });

  it("consume last_stamp_error (D25)", () => {
    renderTab(
      baseTrip({
        invoicing: tripInvoicingFixture({
          invoiceId: "inv-1",
          invoiceStatus: "draft",
          lastStampError: {
            code: "INVALID_RFC",
            message: "RFC inválido en parada",
            pacCode: null,
            hint: null,
            at: "2026-11-11T16:00:00Z",
            by: "u1",
            byName: "Ana",
            stopId: "stop-1",
          },
        }),
      }),
    );
    expect(screen.getByText(billingCopy.stampError.chip)).toBeInTheDocument();
    expect(screen.getByText("RFC inválido en parada")).toBeInTheDocument();
  });

  it("consume fiscal_attention (D21)", () => {
    renderTab(
      baseTrip({
        requiresFiscalAttention: true,
        fiscalAttention: {
          mutationKind: "cargo",
          flaggedAt: "2026-11-12T10:00:00Z",
          flaggedBy: "u2",
          flaggedByName: "Luis",
          reason: "Se agregó carga en ruta",
          invoiceStatus: "stamped",
        },
      }),
    );
    expect(screen.getByText("Se agregó carga en ruta")).toBeInTheDocument();
    expect(screen.getByText("Luis")).toBeInTheDocument();
  });

  it("F5b P1-A: Pendientes en columna principal antes de Facturas", () => {
    renderTab(
      baseTrip({
        requiresFiscalAttention: true,
        fiscalAttention: {
          mutationKind: "fleet",
          flaggedAt: "2026-11-12T10:00:00Z",
          flaggedBy: "u2",
          flaggedByName: "Rosa",
          reason: "Se reasignó la unidad",
          invoiceStatus: "stamped",
        },
      }),
    );
    const pendientes = screen.getByTestId("trip-billing-pendientes");
    const invoices = screen.getByTestId("trip-billing-invoices");
    const main = screen.getByTestId("trip-billing-tab").firstElementChild;
    expect(main).toContainElement(pendientes);
    expect(main).toContainElement(invoices);
    expect(
      pendientes.compareDocumentPosition(invoices) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByText(billingCopy.invoices.toSubstitute)).toBeInTheDocument();
    expect(
      screen.queryByText(/Qué ve cada rol/i),
    ).not.toBeInTheDocument();
  });

  it("F-ds P1-B2: chip Reparto, share (monto+%+barra) y Base de flete", () => {
    const split = activeSplitFixture();
    renderTab(
      baseTrip({
        invoicing: tripInvoicingFixture({
          hasActiveSplit: true,
          canGenerateSplitShareInvoice: true,
        }),
      }),
      split,
    );
    expect(screen.getByTestId("trip-billing-split-chip")).toHaveTextContent(
      billingCopy.split.activeChip("60", "40"),
    );
    expect(screen.getByText(billingCopy.invoices.sharePercent(60))).toBeInTheDocument();
    expect(screen.getByText(billingCopy.invoices.sharePercent(40))).toBeInTheDocument();
    expect(screen.getByText(billingCopy.invoices.freightBasis)).toBeInTheDocument();
    expect(screen.getByText(billingCopy.invoices.sharePercent(100))).toBeInTheDocument();
    // Barra Progress con aria-hidden: no expone role progressbar
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    const invoices = screen.getByTestId("trip-billing-invoices");
    expect(invoices.querySelector("tr[data-entity-summary-row]")).toBeTruthy();
  });
});
