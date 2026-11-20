import { describe, expect, it } from "vitest";

import type { Trip, TripLinkedInvoice, TripRevenueSplit } from "@features/trips/domain";
import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";
import { billingCopy } from "../../copy/tripDetail/billingCopy";
import {
  buildTripBillingInvoiceRows,
  summarizeVigente,
} from "./buildTripBillingInvoiceRows";

const copy = billingCopy.invoices;

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
      invoiceFolio: "A-1",
      invoiceStatus: "stamped",
      hasActiveInvoice: true,
      hasActivePrimaryInvoice: true,
      hasActivePrincipalInvoice: true,
      cartaPorteAttached: true,
      canGenerateAccessoryInvoice: true,
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
    client: {
      id: "c1",
      legalName: "Cliente Demo",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
    updatedBy: null,
    ...overrides,
  } as Trip;
}

function linked(
  overrides: Partial<TripLinkedInvoice> & Pick<TripLinkedInvoice, "id">,
): TripLinkedInvoice {
  return {
    serie: "A",
    folio: 1,
    status: "stamped",
    billingScope: "primary_transport",
    splitLegId: null,
    attachCartaPorte: true,
    sharePercent: null,
    total: 1160,
    totalPaid: 200,
    balanceDue: 960,
    stampedAt: "2026-11-12T14:00:00Z",
    parentInvoiceId: null,
    createdAt: "2026-11-12T13:00:00Z",
    ...overrides,
  };
}

function activeSplit(): TripRevenueSplit {
  return {
    id: "split-1",
    tripId: "trip-1",
    status: "active",
    basisAmount: 10000,
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

describe("buildTripBillingInvoiceRows", () => {
  it("docs: flete + accesorias con cobrado/saldo; borrador en —; summary sin borrador", () => {
    const rows = buildTripBillingInvoiceRows({
      trip: baseTrip(),
      canCreate: true,
      linkedInvoices: [
        linked({
          id: "inv-1",
          folio: 10,
          total: 11600,
          totalPaid: 5000,
          balanceDue: 6600,
        }),
        linked({
          id: "acc-stamped",
          folio: 20,
          billingScope: "accessory",
          attachCartaPorte: false,
          total: 1160,
          totalPaid: 1160,
          balanceDue: 0,
          createdAt: "2026-11-12T14:00:00Z",
        }),
        linked({
          id: "acc-draft",
          folio: 21,
          status: "draft",
          billingScope: "accessory",
          attachCartaPorte: false,
          total: 580,
          totalPaid: 0,
          balanceDue: 580,
          stampedAt: null,
          createdAt: "2026-11-12T15:00:00Z",
        }),
      ],
    });

    expect(rows).toHaveLength(3);
    expect(rows[0]?.kind).toBe("freight");
    expect(rows[0]?.showAmounts).toBe(true);
    expect(rows[0]?.collected).toBe(5000);
    expect(rows[1]?.kind).toBe("accessory");
    expect(rows[1]?.collected).toBe(1160);
    expect(rows[2]?.isDraft).toBe(true);
    expect(rows[2]?.showAmounts).toBe(false);

    const summary = summarizeVigente(rows);
    expect(summary.rowCount).toBe(2);
    expect(summary.total).toBe(11600 + 1160);
    expect(summary.collected).toBe(5000 + 1160);
  });

  it("cadena sustitución D27: títulos tipados, Por cancelar, cobrado solo en activa", () => {
    const rows = buildTripBillingInvoiceRows({
      trip: baseTrip({ requiresFiscalAttention: true }),
      canCreate: true,
      linkedInvoices: [
        linked({
          id: "orig",
          folio: 1,
          status: "stamped",
          totalPaid: 100,
          balanceDue: 1060,
          createdAt: "2026-11-10T10:00:00Z",
        }),
        linked({
          id: "sub",
          folio: 2,
          parentInvoiceId: "orig",
          totalPaid: 0,
          balanceDue: 1160,
          createdAt: "2026-11-11T10:00:00Z",
        }),
      ],
    });

    expect(rows).toHaveLength(2);
    const active = rows.find((r) => r.id === "sub");
    const original = rows.find((r) => r.id === "orig");
    expect(active?.title).toBe(copy.docFreight);
    expect(original?.title).toBe(copy.docFreightOriginal);
    expect(active?.subtitle).toContain(copy.replaces("A-1"));
    expect(original?.subtitle).toContain(copy.replacedBy("A-2"));
    expect(active?.showAmounts).toBe(true);
    expect(original?.showAmounts).toBe(false);
    expect(original?.countsInVigente).toBe(false);
    expect(original?.pendingCancel).toBe(true);
    expect(original?.strikeTotal).toBe(true);
    expect(active?.needsSubstitute).toBe(false);
    expect(original?.needsSubstitute).toBe(false);
    expect(summarizeVigente(rows).rowCount).toBe(1);
    expect(summarizeVigente(rows).total).toBe(1160);
  });

  it("ATF sin sustituta → Por sustituir en flete vigente", () => {
    const rows = buildTripBillingInvoiceRows({
      trip: baseTrip({ requiresFiscalAttention: true }),
      canCreate: true,
      linkedInvoices: [
        linked({
          id: "inv-1",
          folio: 10,
          total: 11600,
        }),
      ],
    });
    expect(rows[0]?.needsSubstitute).toBe(true);
    expect(rows[0]?.pendingCancel).toBe(false);
  });

  it("split D19: 1 fila/pierna + shareAmount de base; accesoria fuera del eje piernas", () => {
    const rows = buildTripBillingInvoiceRows({
      trip: baseTrip({
        clientId: "c1",
        invoicing: tripInvoicingFixture({
          hasActiveSplit: true,
          canGenerateSplitShareInvoice: true,
        }),
      }),
      revenueSplit: activeSplit(),
      canCreate: true,
      linkedInvoices: [
        linked({
          id: "inv-a",
          folio: 30,
          billingScope: "split_share",
          splitLegId: "leg-a",
          sharePercent: 60,
          total: 6960,
          totalPaid: 1000,
          balanceDue: 5960,
        }),
        linked({
          id: "acc-1",
          folio: 40,
          billingScope: "accessory",
          attachCartaPorte: false,
          total: 500,
          totalPaid: 0,
          balanceDue: 500,
        }),
      ],
    });

    const legs = rows.filter((r) => r.kind === "split");
    expect(legs).toHaveLength(2);
    expect(legs[0]?.id).toBe("inv-a");
    expect(legs[0]?.title).toBe("Cliente A");
    expect(legs[0]?.isPrimaryClient).toBe(true);
    expect(legs[0]?.carriesCartaPorte).toBe(true);
    expect(legs[0]?.folio).toBe("A-30");
    expect(legs[0]?.collected).toBe(1000);
    expect(legs[0]?.sharePercent).toBe(60);
    expect(legs[0]?.shareAmount).toBe(6000);
    expect(legs[0]?.total).toBe(6960);
    expect(legs[1]?.id).toBe("leg-placeholder-leg-b");
    expect(legs[1]?.isPrimaryClient).toBe(false);
    expect(legs[1]?.shareAmount).toBe(4000);
    expect(legs[1]?.invoicePortionHref).toContain("split_share");
    expect(legs[1]?.showAmounts).toBe(false);
    expect(rows.filter((r) => r.kind === "accessory")).toHaveLength(1);
  });

  it("split: cadena de sustitución subordinada (1 fila, no hermano)", () => {
    const rows = buildTripBillingInvoiceRows({
      trip: baseTrip({
        clientId: "c1",
        invoicing: tripInvoicingFixture({
          hasActiveSplit: true,
          canGenerateSplitShareInvoice: true,
        }),
      }),
      revenueSplit: activeSplit(),
      canCreate: true,
      linkedInvoices: [
        linked({
          id: "orig-a",
          folio: 1,
          status: "cancellation_pending",
          billingScope: "split_share",
          splitLegId: "leg-a",
          sharePercent: 60,
          total: 6000,
          totalPaid: 100,
          balanceDue: 5900,
          createdAt: "2026-11-10T10:00:00Z",
        }),
        linked({
          id: "sub-a",
          folio: 2,
          parentInvoiceId: "orig-a",
          billingScope: "split_share",
          splitLegId: "leg-a",
          sharePercent: 60,
          total: 6960,
          totalPaid: 0,
          balanceDue: 6960,
          createdAt: "2026-11-11T10:00:00Z",
        }),
      ],
    });

    const legARows = rows.filter(
      (r) => r.kind === "split" && (r.id === "sub-a" || r.id === "orig-a"),
    );
    expect(legARows).toHaveLength(1);
    expect(legARows[0]?.id).toBe("sub-a");
    expect(legARows[0]?.subtitle).toContain(copy.replaces("A-1"));
    expect(legARows[0]?.countsInVigente).toBe(true);
    expect(rows.some((r) => r.id === "orig-a")).toBe(false);
  });

  it("viaje en falso: filas tipadas Viaje en falso + Flete cancelado tachado", () => {
    const rows = buildTripBillingInvoiceRows({
      trip: baseTrip({
        operationalOutcome: "false_trip",
        invoicing: tripInvoicingFixture({
          canGenerateFalseTripInvoice: true,
        }),
      }),
      canCreate: true,
      linkedInvoices: [
        linked({
          id: "cancelled-freight",
          folio: 5,
          status: "cancelled",
          billingScope: "primary_transport",
          total: 2000,
          totalPaid: 0,
          balanceDue: 0,
          createdAt: "2026-11-01T10:00:00Z",
        }),
      ],
    });

    const pending = rows.find((r) => r.kind === "false_trip_pending");
    expect(pending).toBeDefined();
    expect(pending?.title).toBe(copy.docFalseTrip);
    expect(pending?.subtitle).toBe(copy.docFalseTripSubtitle);
    expect(pending?.id).toBe("false-trip-pending");

    const freight = rows.find((r) => r.id === "cancelled-freight");
    expect(freight?.kind).toBe("freight");
    expect(freight?.title).toBe(copy.docFreight);
    expect(freight?.strikeTotal).toBe(true);
    expect(rows.indexOf(pending!)).toBeLessThan(rows.indexOf(freight!));
    expect(rows.every((r) => r.kind !== "accessory")).toBe(true);
  });

  it("viaje en falso timbrado: título Viaje en falso + subtítulo Ingreso sin CP", () => {
    const rows = buildTripBillingInvoiceRows({
      trip: baseTrip({
        operationalOutcome: "false_trip",
        client: { id: "c1", legalName: "INMOBILIARIA CVA" },
      }),
      canCreate: false,
      linkedInvoices: [
        linked({
          id: "false-1",
          folio: 77,
          status: "stamped",
          billingScope: "false_trip",
          attachCartaPorte: false,
          total: 31920,
          totalPaid: 0,
          balanceDue: 31920,
        }),
      ],
    });

    const falseRow = rows.find((r) => r.kind === "false_trip");
    expect(falseRow?.title).toBe(copy.docFalseTrip);
    expect(falseRow?.subtitle).toContain(copy.docFalseTripSubtitle);
    expect(falseRow?.subtitle).toContain("INMOBILIARIA CVA");
    expect(falseRow?.countsInVigente).toBe(true);
  });

  it("D-INV-8: viaje cancelado sin factura en pierna → no emitir, sin CTA", () => {
    const rows = buildTripBillingInvoiceRows({
      trip: baseTrip({
        status: "cancelled",
        invoicing: tripInvoicingFixture({
          hasActiveSplit: true,
          canGenerateSplitShareInvoice: true,
        }),
      }),
      revenueSplit: activeSplit(),
      canCreate: true,
      linkedInvoices: [],
    });

    const placeholders = rows.filter((r) =>
      r.id.startsWith("leg-placeholder-"),
    );
    expect(placeholders).toHaveLength(2);
    expect(placeholders.every((r) => r.subtitle === copy.noEmit)).toBe(true);
    expect(placeholders.every((r) => r.invoicePortionHref == null)).toBe(true);
  });

  it("cancelada no suma a Facturado vigente", () => {
    const rows = buildTripBillingInvoiceRows({
      trip: baseTrip(),
      canCreate: false,
      linkedInvoices: [
        linked({
          id: "alive",
          folio: 1,
          total: 1000,
          totalPaid: 100,
          balanceDue: 900,
        }),
        linked({
          id: "dead",
          folio: 2,
          status: "cancelled",
          total: 9999,
          totalPaid: 0,
          balanceDue: 0,
          createdAt: "2026-11-13T10:00:00Z",
        }),
      ],
    });
    const summary = summarizeVigente(rows);
    expect(summary.total).toBe(1000);
    expect(summary.collected).toBe(100);
  });
});
