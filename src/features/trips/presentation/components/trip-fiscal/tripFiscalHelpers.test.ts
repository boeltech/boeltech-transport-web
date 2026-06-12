import { describe, expect, it } from "vitest";
import { TripStatus, type Trip, type TripStop } from "@features/trips/domain";
import {
  buildFixSheetInitialValues,
  getEffectiveStopRfc,
  shouldShowFiscalWarningChip,
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
    invoicing: {
      hasActiveInvoice: true,
      canGenerateInvoice: false,
      invoiceId: "inv-1",
      invoiceFolio: "A-1",
      invoiceCfdiUuid: null,
      invoiceStatus: "draft",
      blockReason: null,
    },
    ...overrides,
  } as Trip;
}

describe("tripFiscalHelpers", () => {
  it("prioriza deliveryRfcRemitenteDestinatario sobre rfc de dirección", () => {
    const stop = makeStop({
      deliveryRfcRemitenteDestinatario: "CRN140902QW3",
      rfcRemitenteDestinatario: "AAA010101AAA",
      deliveryNombreRemitenteDestinatario: "Entrega",
    });

    expect(getEffectiveStopRfc(stop)).toBe("CRN140902QW3");
    expect(buildFixSheetInitialValues(stop)).toEqual({
      rfc: "CRN140902QW3",
      nombre: "Entrega",
    });
  });

  it("muestra chip solo en viaje completado con factura no timbrada y RFC inválido", () => {
    const invalidStop = makeStop({
      deliveryRfcRemitenteDestinatario: "INVALIDO",
    });
    const validStop = makeStop({
      deliveryRfcRemitenteDestinatario: "EKU9003173C9",
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
          invoicing: {
            hasActiveInvoice: true,
            canGenerateInvoice: false,
            invoiceId: "inv-1",
            invoiceFolio: "A-1",
            invoiceCfdiUuid: "uuid",
            invoiceStatus: "stamped",
            blockReason: null,
          },
        }),
        invalidStop,
      ),
    ).toBe(false);
  });
});
