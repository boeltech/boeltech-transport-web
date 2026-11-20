import { beforeEach, describe, expect, it, vi } from "vitest";
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
  buildInvoiceCreateHref: (params: {
    tripId: string;
    scope?: string;
    legId?: string;
  }) => {
    const q = new URLSearchParams({ tripId: params.tripId });
    if (params.scope) q.set("scope", params.scope);
    if (params.legId) q.set("legId", params.legId);
    return `/invoices/new?${q.toString()}`;
  },
}));

const useTripLinkedInvoicesMock = vi.fn(() => ({
  data: [] as unknown[],
  isLoading: false,
}));

const useTripTimelineMock = vi.fn(() => ({
  data: undefined as
    | { events: Array<{
        eventType: string;
        notes: string | null;
        capturedBy: string | null;
        capturedByName: string | null;
        occurredAt: Date;
      }> }
    | undefined,
  isLoading: false,
}));

const useTripExpensesSummaryMock = vi.fn(() => ({
  data: undefined as { total: number } | undefined,
  isLoading: false,
}));

vi.mock("@features/trips/application", () => ({
  useOperationalCashReceipts: () => ({
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useTripLinkedInvoices: (...args: unknown[]) =>
    useTripLinkedInvoicesMock(...args),
  useTripTimeline: (...args: unknown[]) => useTripTimelineMock(...args),
  useTripExpensesSummary: (...args: unknown[]) =>
    useTripExpensesSummaryMock(...args),
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
    falseTripDeclaredByName: null,
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
  beforeEach(() => {
    useTripLinkedInvoicesMock.mockReset();
    useTripTimelineMock.mockReset();
    useTripExpensesSummaryMock.mockReset();
    useTripLinkedInvoicesMock.mockReturnValue({
      data: [
        {
          id: "inv-1",
          serie: "F",
          folio: 1,
          status: "stamped",
          billingScope: "primary_transport",
          splitLegId: null,
          attachCartaPorte: true,
          sharePercent: null,
          total: 18500,
          totalPaid: 0,
          balanceDue: 18500,
          stampedAt: "2026-11-12T14:00:00Z",
          parentInvoiceId: null,
          createdAt: "2026-11-12T13:00:00Z",
        },
      ],
      isLoading: false,
    });
    useTripTimelineMock.mockReturnValue({
      data: undefined,
      isLoading: false,
    });
    useTripExpensesSummaryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
    });
  });

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

  it("consume fiscal_attention por mutation_kind (no reason técnico)", () => {
    renderTab(
      baseTrip({
        requiresFiscalAttention: true,
        fiscalAttention: {
          mutationKind: "cargo",
          flaggedAt: "2026-11-12T10:00:00Z",
          flaggedBy: "u2",
          flaggedByName: "Luis",
          reason: "Mutación operativa (cargo) con CFDI vigente; requiere sustitución",
          invoiceStatus: "stamped",
        },
      }),
    );
    expect(
      screen.getByText(billingCopy.pendientes.mutationKinds.cargo),
    ).toBeInTheDocument();
    expect(
      screen.getByText(billingCopy.pendientes.actionBody),
    ).toBeInTheDocument();
    expect(screen.getByText("Luis")).toBeInTheDocument();
    expect(screen.queryByText(/Mutación operativa/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bCFDI\b/)).not.toBeInTheDocument();
  });

  it("stop_replan + reason técnico → título humano sin códigos", () => {
    renderTab(
      baseTrip({
        requiresFiscalAttention: true,
        invoicing: tripInvoicingFixture({
          invoiceId: "inv-1",
          invoiceFolio: "F-1",
          invoiceStatus: "stamped",
          hasActiveInvoice: true,
          hasActivePrimaryInvoice: true,
          hasActivePrincipalInvoice: true,
          hasActiveSplit: true,
          cartaPorteAttached: true,
        }),
        fiscalAttention: {
          mutationKind: "stop_replan",
          flaggedAt: "2026-11-12T10:00:00Z",
          flaggedBy: "u2",
          flaggedByName: "Ana",
          reason:
            "Mutación operativa (stop_replan) con CFDI vigente; requiere sustitución",
          invoiceStatus: "stamped",
        },
      }),
    );
    expect(
      screen.getByText(billingCopy.pendientes.mutationKinds.stop_replan),
    ).toBeInTheDocument();
    expect(
      screen.getByText(billingCopy.pendientes.actionBodySplit),
    ).toBeInTheDocument();
    expect(screen.queryByText(/stop_replan/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Mutación/i)).not.toBeInTheDocument();
  });

  it("F5b P1-A: Pendientes en columna principal antes de Facturas", () => {
    useTripLinkedInvoicesMock.mockReturnValue({
      data: [
        {
          id: "inv-1",
          serie: "F",
          folio: 1187,
          status: "stamped",
          billingScope: "primary_transport",
          splitLegId: null,
          attachCartaPorte: true,
          sharePercent: null,
          total: 31920,
          totalPaid: 0,
          balanceDue: 31920,
          stampedAt: "2026-11-11T10:05:00Z",
          parentInvoiceId: null,
          createdAt: "2026-11-11T10:00:00Z",
        },
      ],
      isLoading: false,
    });
    renderTab(
      baseTrip({
        requiresFiscalAttention: true,
        fiscalAttention: {
          mutationKind: "fleet",
          flaggedAt: "2026-11-12T10:00:00Z",
          flaggedBy: "u2",
          flaggedByName: "Rosa",
          reason: "Mutación operativa (fleet) con CFDI vigente; requiere sustitución",
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
    expect(
      screen.getByText(billingCopy.pendientes.mutationKinds.fleet),
    ).toBeInTheDocument();
    expect(screen.getByText(billingCopy.invoices.toSubstitute)).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: billingCopy.pendientes.substituteCta,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Qué ve cada rol/i),
    ).not.toBeInTheDocument();
  });

  it("D27: aviso cancelar original + historial; sin CTA Sustituir; cobro en sustituta", () => {
    useTripLinkedInvoicesMock.mockReturnValue({
      data: [
        {
          id: "orig",
          serie: "F",
          folio: 1187,
          status: "stamped",
          billingScope: "primary_transport",
          splitLegId: null,
          attachCartaPorte: true,
          sharePercent: null,
          total: 31920,
          totalPaid: 0,
          balanceDue: 31920,
          stampedAt: "2026-11-11T10:05:00Z",
          parentInvoiceId: null,
          createdAt: "2026-11-11T10:00:00Z",
        },
        {
          id: "sub",
          serie: "F",
          folio: 1205,
          status: "stamped",
          billingScope: "primary_transport",
          splitLegId: null,
          attachCartaPorte: true,
          sharePercent: null,
          total: 31920,
          totalPaid: 0,
          balanceDue: 31920,
          stampedAt: "2026-11-13T10:18:00Z",
          parentInvoiceId: "orig",
          createdAt: "2026-11-13T10:18:00Z",
        },
      ],
      isLoading: false,
    });
    renderTab(
      baseTrip({
        requiresFiscalAttention: true,
        fiscalAttention: {
          mutationKind: "fleet",
          flaggedAt: "2026-11-12T09:12:00Z",
          flaggedBy: "u2",
          flaggedByName: "Rosa",
          reason: "Mutación operativa (fleet) con CFDI vigente; requiere sustitución",
          invoiceStatus: "stamped",
        },
        invoicing: tripInvoicingFixture({
          invoiceId: "sub",
          invoiceFolio: "F-1205",
          invoiceStatus: "stamped",
          hasActiveInvoice: true,
          hasActivePrimaryInvoice: true,
          hasActivePrincipalInvoice: true,
          cartaPorteAttached: true,
        }),
      }),
    );

    expect(
      screen.getByText(
        billingCopy.pendientes.cancelOriginalTitle("F-1187"),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: billingCopy.pendientes.cancelOriginalCta,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", {
        name: billingCopy.pendientes.substituteCta,
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(billingCopy.invoices.docFreight)).toBeInTheDocument();
    expect(
      screen.getByText(billingCopy.invoices.docFreightOriginal),
    ).toBeInTheDocument();
    expect(screen.getByText(billingCopy.invoices.toCancel)).toBeInTheDocument();
    expect(
      screen.queryByText(billingCopy.invoices.toSubstitute),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("trip-billing-substitution-history"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(billingCopy.cobroRail.substituteHint),
    ).toBeInTheDocument();
    expect(screen.queryByText(/\bREP\b/)).not.toBeInTheDocument();
    expect(
      screen.getByText(billingCopy.cobroRail.paymentsOnSubstitute("F-1205")),
    ).toBeInTheDocument();
    // Cobro = solo sustituta (31920), no duplica original.
    expect(screen.getAllByText("$31,920.00").length).toBeGreaterThanOrEqual(1);
  });

  it("riel Cobro usa Σ total CFDI vigentes (no facturadoVigente subtotal API)", () => {
    useTripLinkedInvoicesMock.mockReturnValue({
      data: [
        {
          id: "inv-1",
          serie: "F",
          folio: 1,
          status: "stamped",
          billingScope: "primary_transport",
          splitLegId: null,
          attachCartaPorte: true,
          sharePercent: null,
          total: 31920,
          totalPaid: 5000,
          balanceDue: 26920,
          stampedAt: "2026-11-12T14:00:00Z",
          parentInvoiceId: null,
          createdAt: "2026-11-12T13:00:00Z",
        },
        {
          id: "draft-1",
          serie: "F",
          folio: 2,
          status: "draft",
          billingScope: "accessory",
          splitLegId: null,
          attachCartaPorte: false,
          sharePercent: null,
          total: 9999,
          totalPaid: 0,
          balanceDue: 9999,
          stampedAt: null,
          parentInvoiceId: null,
          createdAt: "2026-11-12T15:00:00Z",
        },
        {
          id: "cancelled-1",
          serie: "F",
          folio: 0,
          status: "cancelled",
          billingScope: "primary_transport",
          splitLegId: null,
          attachCartaPorte: true,
          sharePercent: null,
          total: 8000,
          totalPaid: 0,
          balanceDue: 0,
          stampedAt: "2026-11-10T14:00:00Z",
          parentInvoiceId: null,
          createdAt: "2026-11-10T13:00:00Z",
        },
      ],
      isLoading: false,
    });

    renderTab(
      baseTrip({
        // Subtotal API (sin IVA) — no debe pintar el riel Cobro.
        facturadoVigente: 28500,
        cobradoViaje: 999,
        costs: {
          baseRate: 28500,
          fuelCost: 0,
          tollCost: 0,
          otherCosts: 0,
          totalCost: 0,
        },
      }),
    );

    const rail = screen.getByTestId("trip-billing-cobro-rail");
    expect(rail).toHaveTextContent(billingCopy.cobroRail.facturado);
    expect(rail).toHaveTextContent(/\$31,920\.00/);
    expect(rail).toHaveTextContent(/\$5,000\.00/);
    expect(rail).toHaveTextContent(billingCopy.cobroRail.porCobrar);
    expect(rail).toHaveTextContent(/\$26,920\.00/);
    // Subtotal API / cobradoViaje / draft / cancelada no mandan el riel.
    expect(rail).not.toHaveTextContent(/\$28,500\.00/);
    expect(rail).not.toHaveTextContent(/\$999\.00/);
    expect(rail).not.toHaveTextContent(/\$9,999\.00/);
    expect(rail).not.toHaveTextContent(/\$8,000\.00/);
  });

  it("F-ds P1-B2: chip Reparto, share (monto+%+barra) y Base de flete", () => {
    useTripLinkedInvoicesMock.mockReturnValue({
      data: [
        {
          id: "inv-a",
          serie: "A",
          folio: 10,
          status: "stamped",
          billingScope: "split_share",
          splitLegId: "leg-a",
          attachCartaPorte: true,
          sharePercent: 60,
          total: 19152,
          totalPaid: 0,
          balanceDue: 19152,
          stampedAt: "2026-11-12T14:00:00Z",
          parentInvoiceId: null,
          createdAt: "2026-11-12T13:00:00Z",
        },
      ],
      isLoading: false,
    });
    const split = activeSplitFixture();
    renderTab(
      baseTrip({
        clientId: "c1",
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
    expect(screen.getByText(billingCopy.invoices.titleSplit)).toBeInTheDocument();
    expect(screen.getByText(billingCopy.invoices.sharePercent(60))).toBeInTheDocument();
    expect(screen.getByText(billingCopy.invoices.sharePercent(40))).toBeInTheDocument();
    expect(screen.getByText(billingCopy.invoices.freightBasis)).toBeInTheDocument();
    expect(screen.getByText(billingCopy.invoices.sharePercent(100))).toBeInTheDocument();
    // Barra Progress con aria-hidden: no expone role progressbar
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    const invoices = screen.getByTestId("trip-billing-invoices");
    expect(invoices.querySelector("tr[data-entity-summary-row]")).toBeTruthy();
    expect(screen.getByTestId("trip-billing-accessories")).toBeInTheDocument();
  });

  it("D19/F-02: split → piernas en tabla; accesoria en card aparte con cobrado real", () => {
    useTripLinkedInvoicesMock.mockReturnValue({
      data: [
        {
          id: "inv-a",
          serie: "A",
          folio: 10,
          status: "stamped",
          billingScope: "split_share",
          splitLegId: "leg-a",
          attachCartaPorte: true,
          sharePercent: 60,
          total: 19152,
          totalPaid: 500,
          balanceDue: 18652,
          stampedAt: "2026-11-12T14:00:00Z",
          parentInvoiceId: null,
          createdAt: "2026-11-12T13:00:00Z",
        },
        {
          id: "acc-1",
          serie: "A",
          folio: 1,
          status: "stamped",
          billingScope: "accessory",
          splitLegId: null,
          attachCartaPorte: false,
          sharePercent: null,
          total: 1500,
          totalPaid: 1500,
          balanceDue: 0,
          stampedAt: "2026-11-12T15:00:00Z",
          parentInvoiceId: null,
          createdAt: "2026-11-12T15:00:00Z",
        },
      ],
      isLoading: false,
    });
    const split = activeSplitFixture();
    renderTab(
      baseTrip({
        clientId: "c1",
        invoicing: tripInvoicingFixture({
          hasActiveSplit: true,
          canGenerateSplitShareInvoice: true,
        }),
      }),
      split,
    );

    const invoices = screen.getByTestId("trip-billing-invoices");
    const accessories = screen.getByTestId("trip-billing-accessories");

    expect(invoices).toHaveTextContent("Cliente A");
    expect(invoices).toHaveTextContent("Cliente B");
    expect(invoices).toHaveTextContent(billingCopy.invoices.badgePrimaryClient);
    expect(invoices).toHaveTextContent(billingCopy.invoices.badgeCarriesCp);
    expect(invoices).toHaveTextContent(billingCopy.invoices.invoicePortion);
    expect(invoices).not.toHaveTextContent(billingCopy.invoices.docAccessory);
    expect(invoices).not.toHaveTextContent(billingCopy.invoices.columns.collected);

    expect(accessories).toHaveTextContent(
      billingCopy.invoices.accessoriesSectionTitle,
    );
    expect(accessories).toHaveTextContent(billingCopy.invoices.docAccessory);
    expect(accessories.textContent ?? "").toMatch(/1,?500/);

    const freightBasis = screen.getByText(billingCopy.invoices.freightBasis);
    expect(invoices.contains(freightBasis)).toBe(true);
    expect(
      invoices.compareDocumentPosition(accessories) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    expect(screen.getByText(billingCopy.invoices.sharePercent(60))).toBeInTheDocument();
    expect(screen.getByText(billingCopy.invoices.sharePercent(40))).toBeInTheDocument();
    expect(screen.getByText(billingCopy.invoices.sharePercent(100))).toBeInTheDocument();
  });

  it("viaje en falso: Declaración (quién/motivo/gastos) + filas tipadas + sin empty accesorias", () => {
    useTripTimelineMock.mockReturnValue({
      data: {
        events: [
          {
            eventType: "false_trip_declared",
            notes: "El cliente canceló la carga con la unidad en camino.",
            capturedBy: "66d10682-f191-4a6d-91a4-268de3fa0558",
            capturedByName: "Rosa Alcántara",
            occurredAt: new Date("2026-11-13T15:40:00Z"),
          },
        ],
      },
      isLoading: false,
    });
    useTripExpensesSummaryMock.mockReturnValue({
      data: { total: 1180 },
      isLoading: false,
    });
    useTripLinkedInvoicesMock.mockReturnValue({
      data: [
        {
          id: "false-1",
          serie: "A",
          folio: 77,
          status: "stamped",
          billingScope: "false_trip",
          splitLegId: null,
          attachCartaPorte: false,
          sharePercent: null,
          total: 31920,
          totalPaid: 0,
          balanceDue: 31920,
          stampedAt: "2026-11-19T17:40:00Z",
          parentInvoiceId: null,
          createdAt: "2026-11-19T17:00:00Z",
        },
        {
          id: "freight-cancelled",
          serie: "F",
          folio: 1,
          status: "cancelled",
          billingScope: "primary_transport",
          splitLegId: null,
          attachCartaPorte: true,
          sharePercent: null,
          total: 8000,
          totalPaid: 0,
          balanceDue: 0,
          stampedAt: "2026-11-10T14:00:00Z",
          parentInvoiceId: null,
          createdAt: "2026-11-10T13:00:00Z",
        },
      ],
      isLoading: false,
    });
    renderTab(
      baseTrip({
        operationalOutcome: "false_trip",
        falseTripDeclaredAt: new Date("2026-11-13T15:40:00Z"),
        falseTripDeclaredBy: null,
        facturadoVigente: 28500,
        costs: {
          baseRate: 28500,
          fuelCost: 0,
          tollCost: 0,
          otherCosts: 0,
          totalCost: 0,
        },
        invoicing: tripInvoicingFixture({
          invoiceId: "false-1",
          invoiceFolio: "A-77",
          invoiceStatus: "stamped",
          hasActivePrincipalInvoice: true,
        }),
      }),
    );

    const declaration = screen.getByTestId("trip-billing-false-trip");
    expect(declaration).toHaveTextContent(billingCopy.falseTrip.cardTitle);
    expect(declaration).toHaveTextContent("Rosa Alcántara");
    expect(declaration).toHaveTextContent(
      "El cliente canceló la carga con la unidad en camino.",
    );
    expect(declaration).toHaveTextContent(billingCopy.falseTrip.expenses);
    expect(declaration).toHaveTextContent(/\$1,180\.00/);
    expect(
      declaration.querySelector('a[href="/trips/trip-1?tab=costs"]'),
    ).toBeTruthy();

    const invoices = screen.getByTestId("trip-billing-invoices");
    expect(invoices).toHaveTextContent(billingCopy.invoices.docFalseTrip);
    expect(invoices).toHaveTextContent(billingCopy.invoices.docFalseTripSubtitle);
    expect(invoices).toHaveTextContent(billingCopy.invoices.docFreight);
    expect(invoices).toHaveTextContent(billingCopy.invoices.descriptionFalseTrip);
    expect(
      screen.queryByText(billingCopy.invoices.emptyAccessories),
    ).not.toBeInTheDocument();

    // A-77: Cobro = total CFDI vigente (no tarifa/subtotal 28,500).
    const rail = screen.getByTestId("trip-billing-cobro-rail");
    expect(rail).toHaveTextContent(/\$31,920\.00/);
    expect(rail).not.toHaveTextContent(/\$28,500\.00/);
  });
});
