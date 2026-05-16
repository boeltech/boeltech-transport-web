import { describe, expect, it } from "vitest";
import { StopType, TripStatus, type Trip } from "@features/trips/domain";
import {
  buildUpdateTripInputFromQuickEditValues,
  getStopFiscalStatus,
  mapTripToQuickEditValues,
  validateQuickEditStopsFiscal,
} from "./tripQuickEditPayload";
import { validateUpdateTripApiPayload } from "../pages/create/validateTripApiPayload";

const baseTrip = {
  id: "trip-1",
  tenantId: "tenant-1",
  tripCode: "TR-001",
  vehicleId: "vehicle-1",
  driverId: "driver-1",
  clientId: "client-1",
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
      addressId: null,
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

describe("tripQuickEditPayload", () => {
  it("maps trip stops to quick edit values", () => {
    const values = mapTripToQuickEditValues(baseTrip);
    expect(values.stops).toHaveLength(2);
    expect(values.stops[0]?.locationName).toBe("Bodega Origen");
    expect(values.scheduledDeparture).not.toBe("");
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
        rfcRemitenteDestinatario: "INVALIDO",
        deliveryRfcRemitenteDestinatario: "",
      }),
    ).toBe("invalid");
    expect(
      getStopFiscalStatus({
        rfcRemitenteDestinatario: "AAA010101AAA",
        deliveryRfcRemitenteDestinatario: "",
      }),
    ).toBe("ok");
  });

  it("returns stop fiscal validation errors", () => {
    const issues = validateQuickEditStopsFiscal([
      {
        stopId: "stop-1",
        sequenceOrder: 0,
        locationName: "Origen",
        estimatedArrival: "",
        distanceFromPreviousKm: "0",
        rfcRemitenteDestinatario: "",
        nombreRemitenteDestinatario: "",
        deliveryRfcRemitenteDestinatario: "",
        deliveryNombreRemitenteDestinatario: "",
      },
    ]);
    expect(Object.keys(issues)).toContain("stop-1");
  });

  it("builds update payload using edited stop RFC fields", () => {
    const values = mapTripToQuickEditValues(baseTrip);
    values.stops[1] = {
      ...values.stops[1]!,
      rfcRemitenteDestinatario: "ccc010101ccc",
      deliveryRfcRemitenteDestinatario: "ddd010101ddd",
      locationName: "Destino Editado",
      distanceFromPreviousKm: "901.77",
    };

    const payload = buildUpdateTripInputFromQuickEditValues(baseTrip, values);
    expect(payload.stops?.[1]?.rfcRemitenteDestinatario).toBe("CCC010101CCC");
    expect(payload.stops?.[1]?.deliveryRfcRemitenteDestinatario).toBe("DDD010101DDD");
    expect(payload.stops?.[1]?.locationName).toBe("Destino Editado");
    expect(payload.stops?.[1]?.distanceFromPreviousKm).toBe(901.77);
  });

  it("usa helper por defecto si internalRole viene null y deriva ciudad desde locationName si city está vacía", () => {
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
        i === 0
          ? {
              ...s,
              city: "",
              locationName: "Bodega Origen",
            }
          : s,
      ),
    } as unknown as Trip;

    const payload = buildUpdateTripInputFromQuickEditValues(
      tripWithGaps,
      mapTripToQuickEditValues(tripWithGaps),
    );
    expect(payload.internalStaff?.[0]?.internalRole).toBe("helper");
    expect(payload.stops?.[0]?.city).toBe("Bodega Origen");
  });

  it("arma el mismo contrato PUT que el sheet: horarios, parada, fiscal y distancia; valida contra updateTripSchema", () => {
    const linkedAddressId = "11111111-2222-4333-8444-555555555555";
    const tripLinked = {
      ...baseTrip,
      vehicleId: "11111111-1111-4111-8111-111111111111",
      driverId: "22222222-2222-4222-8222-222222222222",
      clientId: "33333333-3333-4333-8333-333333333333",
      stops: (baseTrip.stops ?? []).map((s, i) =>
        i === 0 ? { ...s, addressId: linkedAddressId } : s,
      ),
    } as unknown as Trip;

    const values = mapTripToQuickEditValues(tripLinked);
    values.stops[0] = {
      ...values.stops[0]!,
      locationName: "Parada origen editada",
      rfcRemitenteDestinatario: "EKU9003173C9",
      nombreRemitenteDestinatario: "ESCUELA KEMPER URGATE",
      deliveryRfcRemitenteDestinatario: "XAXX010101000",
      deliveryNombreRemitenteDestinatario: "Público en general",
    };
    values.stops[1] = {
      ...values.stops[1]!,
      locationName: "Destino editado",
      distanceFromPreviousKm: "12.5",
      rfcRemitenteDestinatario: "BBB010101BBB",
      nombreRemitenteDestinatario: "Destino fiscal SA",
    };

    const payload = buildUpdateTripInputFromQuickEditValues(tripLinked, values);

    expect(payload.scheduledDeparture).toContain("2026-05-14");
    expect(payload.scheduledArrival).toContain("2026-05-14");

    const s0 = payload.stops?.[0];
    expect(s0?.addressId).toBe(linkedAddressId);
    expect(s0?.locationName).toBe("Parada origen editada");
    expect(s0?.rfcRemitenteDestinatario).toBe("EKU9003173C9");
    expect(s0?.nombreRemitenteDestinatario).toBe("ESCUELA KEMPER URGATE");
    expect(s0?.deliveryRfcRemitenteDestinatario).toBe("XAXX010101000");
    expect(s0?.deliveryNombreRemitenteDestinatario).toBe("Público en general");

    const s1 = payload.stops?.[1];
    expect(s1?.locationName).toBe("Destino editado");
    expect(s1?.distanceFromPreviousKm).toBe(12.5);
    expect(s1?.rfcRemitenteDestinatario).toBe("BBB010101BBB");
    expect(s1?.nombreRemitenteDestinatario).toBe("Destino fiscal SA");

    expect(validateUpdateTripApiPayload(payload)).toEqual({ ok: true });
  });
});
