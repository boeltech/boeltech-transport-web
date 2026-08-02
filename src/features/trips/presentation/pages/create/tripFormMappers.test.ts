import { describe, expect, it } from "vitest";
import { StopType, TripStatus, type Trip } from "@features/trips/domain";
import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";

import { mapTripToWizardFormValues } from "./tripFormMappers";

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
  notes: "Notas del viaje",
  cancellationReason: null,
  invoicing: tripInvoicingFixture({
    canGenerateInvoice: true,
  }),
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
  ],
} as unknown as Trip;

describe("mapTripToWizardFormValues", () => {
  it("maps core trip fields and schedule to wizard form values", () => {
    const result = mapTripToWizardFormValues(baseTrip);

    expect(result.vehicleId).toBe(baseTrip.vehicleId);
    expect(result.driverId).toBe(baseTrip.driverId);
    expect(result.clientId).toBe(baseTrip.clientId);
    expect(result.cfdiDocumentIntent).toBe("ingreso");
    expect(result.baseRate).toBe(10000);
    expect(result.notes).toBe("Notas del viaje");
    expect(result.scheduledDeparture).not.toBe("");
    expect(result.scheduledArrival).not.toBe("");
    expect(result.startMileage).toBe(1000);
  });

  it("maps stop arrays and preserves sequence metadata", () => {
    const result = mapTripToWizardFormValues(baseTrip);

    expect(result.stops).toHaveLength(1);
    expect(result.stops[0]?.id).toBe("stop-1");
    expect(result.stops[0]?.sequenceOrder).toBe(0);
    expect(result.stops[0]?.stopType).toEqual(["origin", "pickup"]);
    expect(result.stops[0]?.satStateCode).toBe("JAL");
    expect(result.stops[0]?.rfcRemitenteDestinatario).toBe("AAA010101AAA");
  });

  it("defaults empty optional collections", () => {
    const result = mapTripToWizardFormValues(baseTrip);

    expect(result.cargos).toEqual([]);
    expect(result.expenses).toEqual([]);
    expect(result.internalStaff).toEqual([]);
  });

  it("does not promote stop snapshot addressId to client/source catalog ids", () => {
    const result = mapTripToWizardFormValues(baseTrip);
    const stop = result.stops[0];

    expect(stop?.addressId).toBe("");
    expect(stop?.clientAddressId).toBe("");
    expect(stop?.sourceAddressId).toBe("");
    expect(stop?.street).toBe("Av. Demo");
    expect(stop?.satStateCode).toBe("JAL");
  });

  it("maps catalog sourceAddressId and still clears snapshot addressId", () => {
    const catalogId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const trip = {
      ...baseTrip,
      stops: [
        {
          ...baseTrip.stops[0],
          addressId: "11111111-2222-4333-8444-555555555555",
          clientAddressId: null,
          sourceAddressId: catalogId,
        },
      ],
    } as unknown as Trip;

    const result = mapTripToWizardFormValues(trip);
    const stop = result.stops[0];

    expect(stop?.sourceAddressId).toBe(catalogId);
    expect(stop?.clientAddressId).toBe("");
    expect(stop?.addressId).toBe("");
  });
});
