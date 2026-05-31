import { describe, expect, it } from "vitest";
import { StopType, TripStatus, type Trip } from "@features/trips/domain";

import { validateUpdateTripApiPayload } from "../../pages/create/validateTripApiPayload";
import { buildScheduleUpdateInput } from "./tripSchedulePatch";
import { buildStopOperationalUpdateInput } from "./tripStopOperationalPatch";
import {
  getStopFiscalStatus,
  mapTripStopToOperationalValues,
  mapTripToScheduleFormValues,
  validateStopOperationalFields,
} from "./tripStopOperationalFields";

const baseTrip = {
  id: "trip-1",
  tenantId: "tenant-1",
  tripCode: "TR-001",
  vehicleId: "11111111-1111-4111-8111-111111111111",
  driverId: "22222222-2222-4222-8222-222222222222",
  clientId: "33333333-3333-4333-8333-333333333333",
  scheduledDeparture: new Date("2026-05-14T12:00:00.000Z"),
  scheduledArrival: new Date("2026-05-14T16:00:00.000Z"),
  actualDeparture: null,
  actualArrival: null,
  mileage: { start: 1000, end: null },
  originCity: "Guadalajara",
  originState: "JAL",
  destinationCity: "Monterrey",
  destinationState: "NLE",
  cargo: { description: "Carga demo", weight: 100, volume: null, units: 2, value: 5000 },
  costs: { baseRate: 10000, fuelCost: 0, tollCost: 0, otherCosts: 0, totalCost: 10000 },
  detailedCosts: null,
  profitability: null,
  status: TripStatus.SCHEDULED,
  notes: "Notas",
  cancellationReason: null,
  invoicing: {
    hasActiveInvoice: false,
    canGenerateInvoice: true,
    blockReason: null,
    invoiceId: null,
    invoiceFolio: null,
    invoiceUuid: null,
    invoiceStatus: null,
  },
  requiresFiscalAttention: false,
  fiscalActionRequired: null,
  totalDistRec: null,
  idCcp: null,
  cfdiDocumentIntent: "ingreso",
  createdAt: new Date("2026-05-13T00:00:00.000Z"),
  updatedAt: new Date("2026-05-13T00:00:00.000Z"),
  createdBy: null,
  updatedBy: null,
  createdByName: null,
  updatedByName: null,
  vehicle: undefined,
  driver: undefined,
  client: undefined,
  internalStaff: [],
  cargos: [],
  expenses: [],
  statusHistory: [],
  stops: [
    {
      id: "stop-1",
      tenantId: "tenant-1",
      tripId: "trip-1",
      sequenceOrder: 0,
      stopType: [StopType.ORIGIN, StopType.PICKUP],
      addressId: "11111111-2222-4333-8444-555555555555",
      clientId: null,
      clientAddressId: null,
      address: "Origen address",
      city: "Guadalajara",
      state: "JAL",
      postalCode: "44100",
      latitude: 20.67,
      longitude: -103.35,
      locationName: "Bodega Origen",
      contactName: null,
      contactPhone: null,
      estimatedArrival: new Date("2026-05-14T12:00:00.000Z"),
      actualArrival: null,
      estimatedDeparture: null,
      actualDeparture: null,
      status: "pending",
      notes: null,
      idUbicacion: null,
      street: "Av. Demo",
      exteriorNumber: "10",
      interiorNumber: null,
      colonia: null,
      reference: null,
      satCountryCode: "MEX",
      satEstadoCode: "JAL",
      satMunicipioCode: "039",
      satLocalidadCode: null,
      satColoniaCode: null,
      rfcRemitenteDestinatario: "AAA010101AAA",
      nombreRemitenteDestinatario: "Origen SA",
      deliveryRfcRemitenteDestinatario: null,
      deliveryNombreRemitenteDestinatario: null,
      remitentePartnerId: null,
      destinatarioPartnerId: null,
      distanceFromPreviousKm: 0,
      distanceSource: "manual",
      distanceProvider: "stub",
      distanceConfidence: "high",
      distanceComputedAt: null,
      createdAt: new Date("2026-05-13T00:00:00.000Z"),
      updatedAt: new Date("2026-05-13T00:00:00.000Z"),
    },
    {
      id: "stop-2",
      tenantId: "tenant-1",
      tripId: "trip-1",
      sequenceOrder: 1,
      stopType: [StopType.DESTINATION, StopType.DELIVERY],
      addressId: null,
      clientId: null,
      clientAddressId: null,
      address: "Destino address",
      city: "Monterrey",
      state: "NLE",
      postalCode: "64000",
      latitude: 25.68,
      longitude: -100.31,
      locationName: "Cliente Destino",
      contactName: null,
      contactPhone: null,
      estimatedArrival: new Date("2026-05-14T16:00:00.000Z"),
      actualArrival: null,
      estimatedDeparture: null,
      actualDeparture: null,
      status: "pending",
      notes: null,
      idUbicacion: null,
      street: "Calle Final",
      exteriorNumber: "100",
      interiorNumber: null,
      colonia: null,
      reference: null,
      satCountryCode: "MEX",
      satEstadoCode: "NLE",
      satMunicipioCode: "039",
      satLocalidadCode: null,
      satColoniaCode: null,
      rfcRemitenteDestinatario: "BBB010101BBB",
      nombreRemitenteDestinatario: "Destino SA",
      deliveryRfcRemitenteDestinatario: null,
      deliveryNombreRemitenteDestinatario: null,
      remitentePartnerId: null,
      destinatarioPartnerId: null,
      distanceFromPreviousKm: 900.14,
      distanceSource: "manual",
      distanceProvider: "stub",
      distanceConfidence: "high",
      distanceComputedAt: null,
      createdAt: new Date("2026-05-13T00:00:00.000Z"),
      updatedAt: new Date("2026-05-13T00:00:00.000Z"),
    },
  ],
} as unknown as Trip;

describe("tripDetailPatch", () => {
  it("maps schedule form values from trip", () => {
    const values = mapTripToScheduleFormValues(baseTrip);
    expect(values.scheduledDeparture).not.toBe("");
    expect(values.scheduledArrival).not.toBe("");
  });

  it("builds partial schedule update payload", () => {
    const values = mapTripToScheduleFormValues(baseTrip);
    const payload = buildScheduleUpdateInput(baseTrip, values);
    expect(payload.scheduledDeparture).toContain("2026-05-14");
    expect(payload.scheduledArrival).toContain("2026-05-14");
    expect(payload.stops?.[1]?.estimatedArrival).toContain("2026-05-14");
    expect(validateUpdateTripApiPayload(payload)).toEqual({ ok: true });
  });

  it("syncs scheduledArrival with destination estimatedArrival on stop edit", () => {
    const stop = mapTripStopToOperationalValues(baseTrip.stops![1]!);
    const edited = {
      ...stop,
      estimatedArrival: "2026-05-15T10:30",
    };
    const payload = buildStopOperationalUpdateInput(baseTrip, stop.stopId, edited);
    expect(payload.scheduledArrival).toContain("2026-05-15");
    expect(payload.stops?.[1]?.estimatedArrival).toContain("2026-05-15");
  });

  it("resolves fiscal status correctly", () => {
    expect(
      getStopFiscalStatus({
        rfcRemitenteDestinatario: "",
        deliveryRfcRemitenteDestinatario: "",
      }),
    ).toBe("pending");
    expect(
      getStopFiscalStatus({
        rfcRemitenteDestinatario: "AAA010101AAA",
        deliveryRfcRemitenteDestinatario: "",
      }),
    ).toBe("ok");
  });

  it("validates stop operational fields", () => {
    const stop = mapTripStopToOperationalValues(baseTrip.stops![1]!);
    const emptyRfc = { ...stop, rfcRemitenteDestinatario: "", deliveryRfcRemitenteDestinatario: "" };
    expect(validateStopOperationalFields(emptyRfc).length).toBeGreaterThan(0);
  });

  it("builds stop update without changing locationName", () => {
    const stop = mapTripStopToOperationalValues(baseTrip.stops![1]!);
    const edited = {
      ...stop,
      rfcRemitenteDestinatario: "ccc010101ccc",
      distanceFromPreviousKm: "901.77",
    };
    const payload = buildStopOperationalUpdateInput(baseTrip, stop.stopId, edited);
    expect(payload.stops?.[1]?.rfcRemitenteDestinatario).toBe("CCC010101CCC");
    expect(payload.stops?.[1]?.locationName).toBe("Cliente Destino");
    expect(payload.stops?.[1]?.distanceFromPreviousKm).toBe(901.77);
    expect(validateUpdateTripApiPayload(payload)).toEqual({ ok: true });
  });

  it("derives city from locationName when city is empty", () => {
    const tripWithGaps = {
      ...baseTrip,
      internalStaff: [
        {
          id: "tis-1",
          tripId: "trip-1",
          employeeId: "emp-1",
          internalRole: null,
          employeeFullName: "Apoyo Uno",
          employeeNumber: null,
          employeeStatus: null,
          isPaymentResponsible: false,
          paymentNotes: null,
          createdAt: new Date("2026-05-13T00:00:00.000Z"),
          updatedAt: new Date("2026-05-13T00:00:00.000Z"),
        },
      ],
      stops: (baseTrip.stops ?? []).map((s, i) =>
        i === 0 ? { ...s, city: "", locationName: "Bodega Origen" } : s,
      ),
    } as unknown as Trip;

    const stop = mapTripStopToOperationalValues(tripWithGaps.stops![0]!);
    const payload = buildStopOperationalUpdateInput(tripWithGaps, stop.stopId, stop);
    expect(payload.internalStaff?.[0]?.internalRole).toBe("helper");
    expect(payload.stops?.[0]?.city).toBe("Bodega Origen");
  });
});
