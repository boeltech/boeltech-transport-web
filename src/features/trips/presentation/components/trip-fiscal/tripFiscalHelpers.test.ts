import { describe, expect, it } from "vitest";
import { TripStatus, type Trip, type TripStop } from "@features/trips/domain";
import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";
import {
  buildFixSheetInitialValues,
  canApplyStopFiscalCorrection,
  canUpsertTripRevenueSplit,
  finalizeTripsForStampLoad,
  getEffectiveStopRfc,
  mergePatchedStopIntoTrip,
  resolvePostFiscalFixStampMode,
  resolveIsStampBusy,
  shouldBlockConcurrentStampRequest,
  shouldShowFiscalCorrectionChip,
  shouldShowFiscalWarningChip,
  toFiscalStopDisplayOrder,
  formatFiscalStopPlaceLine,
} from "./tripFiscalHelpers";

function makeStop(overrides: Partial<TripStop> = {}): TripStop {
  return {
    id: "stop-1",
    tenantId: "t1",
    tripId: "trip-1",
    sequenceOrder: 1,
    stopType: ["origin"],
    addressId: "addr-1",
    clientId: null,
    clientAddressId: "client-addr-1",
    address: "Calle 1",
    city: "Monterrey",
    state: "NL",
    postalCode: "64000",
    latitude: null,
    longitude: null,
    locationName: null,
    contactName: null,
    contactPhone: null,
    estimatedArrival: null,
    actualArrival: null,
    estimatedDeparture: null,
    actualDeparture: null,
    status: "pending",
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
    rfcRemitenteDestinatario: "AAA010101AAA",
    nombreRemitenteDestinatario: "Dirección",
    destinatarioRfc: null,
    destinatarioNombre: null,
    sourceAddressId: null,
    deliveryRfcRemitenteDestinatario: null,
    deliveryNombreRemitenteDestinatario: null,
    remitentePartnerId: null,
    destinatarioPartnerId: null,
    distanceFromPreviousKm: null,
    distanceSource: null,
    distanceProvider: null,
    distanceConfidence: null,
    distanceComputedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: "trip-1",
    status: TripStatus.COMPLETED,
    invoicing: tripInvoicingFixture({
      hasActiveInvoice: true,
      canGenerateInvoice: false,
      invoiceId: "inv-1",
      invoiceFolio: "A-1",
      invoiceStatus: "draft",
    }),
    ...overrides,
  } as Trip;
}

describe("tripFiscalHelpers", () => {
  it("prioriza remitente de dirección sobre delivery legacy en origen", () => {
    const stop = makeStop({
      deliveryRfcRemitenteDestinatario: "CRN140902QW3",
      rfcRemitenteDestinatario: "AAA010101AAA",
      deliveryNombreRemitenteDestinatario: "Entrega",
    });

    expect(getEffectiveStopRfc(stop)).toBe("AAA010101AAA");
    expect(buildFixSheetInitialValues(stop)).toEqual({
      rfc: "AAA010101AAA",
      nombre: "Dirección",
    });
  });

  it("muestra chip solo en viaje completado con factura no timbrada y RFC inválido", () => {
    const invalidStop = makeStop({
      rfcRemitenteDestinatario: "INVALIDO",
    });
    const validStop = makeStop({
      rfcRemitenteDestinatario: "EKU9003173C9",
    });

    expect(
      shouldShowFiscalWarningChip(makeTrip(), invalidStop),
    ).toBe(true);
    expect(
      shouldShowFiscalWarningChip(makeTrip(), validStop),
    ).toBe(false);
    expect(
      shouldShowFiscalWarningChip(
        makeTrip({ status: TripStatus.IN_PROGRESS }),
        invalidStop,
      ),
    ).toBe(false);
    expect(
      shouldShowFiscalWarningChip(
        makeTrip({
          invoicing: tripInvoicingFixture({
            hasActiveInvoice: true,
            canGenerateInvoice: false,
            invoiceId: "inv-1",
            invoiceFolio: "A-1",
            invoiceCfdiUuid: "uuid",
            invoiceStatus: "stamped",
          }),
        }),
        invalidStop,
      ),
    ).toBe(false);
  });

  it("permite chip de corrección fiscal cuando RFC es válido y factura es borrador", () => {
    const validStop = makeStop({
      rfcRemitenteDestinatario: "EKU9003173C9",
    });
    const trip = makeTrip();

    expect(canApplyStopFiscalCorrection(trip)).toBe(true);
    expect(shouldShowFiscalCorrectionChip(trip, validStop)).toBe(true);
    expect(shouldShowFiscalWarningChip(trip, validStop)).toBe(false);
  });

  it("no muestra corrección fiscal cuando factura está timbrada", () => {
    const validStop = makeStop({
      rfcRemitenteDestinatario: "EKU9003173C9",
    });
    const trip = makeTrip({
      invoicing: tripInvoicingFixture({
        hasActiveInvoice: true,
        canGenerateInvoice: false,
        invoiceId: "inv-1",
        invoiceFolio: "A-1",
        invoiceCfdiUuid: "uuid",
        invoiceStatus: "stamped",
      }),
    });

    expect(canApplyStopFiscalCorrection(trip)).toBe(false);
    expect(shouldShowFiscalCorrectionChip(trip, validStop)).toBe(false);
  });

  it("toFiscalStopDisplayOrder uses 1-based sequence_order as Parada N", () => {
    expect(toFiscalStopDisplayOrder(1)).toBe(1);
    expect(toFiscalStopDisplayOrder(2)).toBe(2);
    expect(toFiscalStopDisplayOrder(0)).toBe(1);
  });

  it("formatFiscalStopPlaceLine includes locationName before street", () => {
    const stop = makeStop({
      sequenceOrder: 1,
      locationName: "Amazon México",
      street: "Boulevard Manuel Ávila Camacho",
      exteriorNumber: "261",
      city: "México",
      state: "CMX",
      colonia: "Polanco I Sección",
    });
    const line = formatFiscalStopPlaceLine(stop);
    expect(line).toContain("Amazon México");
    expect(line).toContain("Boulevard Manuel Ávila Camacho");
  });

  it("finalizeTripsForStampLoad aborts when expected trips are missing (F1)", () => {
    const incomplete = finalizeTripsForStampLoad(
      ["trip-a", "trip-b"],
      [makeTrip({ id: "trip-a" })],
    );
    expect(incomplete).toEqual({
      status: "incomplete",
      expectedCount: 2,
      loadedCount: 1,
    });

    const emptyExpected = finalizeTripsForStampLoad([], []);
    expect(emptyExpected).toEqual({ status: "ok", trips: [] });

    const ok = finalizeTripsForStampLoad(
      ["trip-a"],
      [makeTrip({ id: "trip-a" })],
    );
    expect(ok.status).toBe("ok");
    if (ok.status === "ok") {
      expect(ok.trips).toHaveLength(1);
    }
  });

  it("mergePatchedStopIntoTrip updates RFC so preflight can pass after fix", () => {
    const trip = makeTrip({
      stops: [
        makeStop({
          id: "stop-1",
          rfcRemitenteDestinatario: null,
        }),
      ],
    });
    const patched = makeStop({
      id: "stop-1",
      rfcRemitenteDestinatario: "EKU9003173C9",
    });

    const merged = mergePatchedStopIntoTrip(trip, patched);
    expect(merged.stops?.[0]?.rfcRemitenteDestinatario).toBe("EKU9003173C9");
    expect(trip.stops?.[0]?.rfcRemitenteDestinatario).toBeNull();
  });

  it("resolvePostFiscalFixStampMode uses requestStamp not raw stamp (F2)", () => {
    expect(
      resolvePostFiscalFixStampMode({
        enableAutoRestamp: true,
        pendingStampInvoiceId: "inv-1",
      }),
    ).toBe("requestStamp");
    expect(
      resolvePostFiscalFixStampMode({
        enableAutoRestamp: false,
        pendingStampInvoiceId: "inv-1",
      }),
    ).toBe("none");
    expect(
      resolvePostFiscalFixStampMode({
        enableAutoRestamp: true,
        pendingStampInvoiceId: null,
      }),
    ).toBe("none");
  });

  it("shouldBlockConcurrentStampRequest and resolveIsStampBusy cover stamp races", () => {
    expect(
      shouldBlockConcurrentStampRequest({ preparing: true, stamping: false }),
    ).toBe(true);
    expect(
      shouldBlockConcurrentStampRequest({ preparing: false, stamping: true }),
    ).toBe(true);
    expect(
      shouldBlockConcurrentStampRequest({ preparing: false, stamping: false }),
    ).toBe(false);

    expect(
      resolveIsStampBusy({
        isPreparingStamp: false,
        isStamping: false,
        preflightOpen: true,
      }),
    ).toBe(true);
    expect(
      resolveIsStampBusy({
        isPreparingStamp: false,
        isStamping: false,
        preflightOpen: false,
      }),
    ).toBe(false);
    expect(
      resolveIsStampBusy({
        isPreparingStamp: false,
        isStamping: false,
        preflightOpen: false,
        fixSheetOpen: true,
      }),
    ).toBe(true);
    expect(
      resolveIsStampBusy({
        isPreparingStamp: false,
        isStamping: false,
        preflightOpen: false,
        pickerOpen: true,
      }),
    ).toBe(true);
  });
});

describe("canUpsertTripRevenueSplit", () => {
  it("permite upsert cuando el API habilita factura primaria", () => {
    expect(
      canUpsertTripRevenueSplit({
        operationalOutcome: "standard",
        invoicing: tripInvoicingFixture({ canGenerateInvoice: true }),
      } as Trip),
    ).toEqual({ allowed: true, blockReason: null });
  });

  it("bloquea upsert con blockReason del API", () => {
    expect(
      canUpsertTripRevenueSplit({
        operationalOutcome: "standard",
        invoicing: tripInvoicingFixture({
          canGenerateInvoice: false,
          blockReason: "Los viajes cancelados no pueden facturarse.",
        }),
      } as Trip),
    ).toEqual({
      allowed: false,
      blockReason: "Los viajes cancelados no pueden facturarse.",
    });
  });

  it("no permite upsert en viaje falso ni con split activo", () => {
    expect(
      canUpsertTripRevenueSplit({
        operationalOutcome: "false_trip",
        invoicing: tripInvoicingFixture({ canGenerateInvoice: true }),
      } as Trip),
    ).toEqual({ allowed: false, blockReason: null });

    expect(
      canUpsertTripRevenueSplit({
        operationalOutcome: "standard",
        invoicing: tripInvoicingFixture({
          canGenerateInvoice: false,
          hasActiveSplit: true,
          splitLegsTotal: 2,
        }),
      } as Trip),
    ).toEqual({ allowed: false, blockReason: null });
  });
});
