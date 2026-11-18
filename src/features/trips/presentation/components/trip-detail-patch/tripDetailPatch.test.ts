import { describe, expect, it } from "vitest";
import { StopType, TripStatus, type Trip } from "@features/trips/domain";
import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";

import { validateUpdateTripApiPayload } from "../../pages/create/validateTripApiPayload";
import {
  buildScheduleDestinationEtaReplaceStops,
  buildScheduleUpdateFromDestinationEta,
  buildScheduleUpdateInput,
} from "./tripSchedulePatch";
import {
  DESTINATION_ETA_MUST_BE_AFTER_DEPARTURE,
  isDestinationEtaAfterDeparture,
} from "./destinationEtaVsDeparture";
import { resolveStopAddressForApi } from "./mapStopToCreateStopInput";
import { mapTripToScheduleFormValues } from "./tripStopOperationalFields";
import { localInputToUtcIso, utcIsoToLocalInput } from "@shared/utils/dateUtils";

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

  it("builds schedule update with dates only (no stops on PUT trip)", () => {
    const values = mapTripToScheduleFormValues(baseTrip);
    const payload = buildScheduleUpdateInput(baseTrip, values);
    expect(payload.scheduledDeparture).toContain("2026-05-14");
    expect(payload.scheduledArrival).toContain("2026-05-14");
    expect(payload.stops).toBeUndefined();
    expect(payload).not.toHaveProperty("cargos");
    expect(validateUpdateTripApiPayload(payload)).toEqual({ ok: true });
  });

  it("omits scheduledArrival when the estimated arrival is empty", () => {
    const values = mapTripToScheduleFormValues(baseTrip);
    const payload = buildScheduleUpdateInput(baseTrip, {
      ...values,
      scheduledArrival: "",
    });
    expect(payload.scheduledDeparture).toContain("2026-05-14");
    expect(payload).not.toHaveProperty("scheduledArrival");
    expect(validateUpdateTripApiPayload(payload)).toEqual({ ok: true });
  });

  it("rejects explicit null scheduledArrival against the shared schema", () => {
    const result = validateUpdateTripApiPayload({
      scheduledDeparture: "2026-05-14T12:00:00.000Z",
      scheduledArrival: null,
    });
    expect(result.ok).toBe(false);
  });

  it("builds replace-stops payload without snapshot addressId for destination ETA", () => {
    const values = mapTripToScheduleFormValues(baseTrip);
    const stops = buildScheduleDestinationEtaReplaceStops(baseTrip, values);
    expect(stops).toHaveLength(2);
    expect(stops?.[0]).not.toHaveProperty("addressId");
    expect(stops?.[1]).not.toHaveProperty("addressId");
    expect(stops?.[1]?.estimatedArrival).toContain("2026-05-14");
    expect(stops?.[1]?.sourceAddressId).toBeUndefined();
  });

  it("F9e: destination ETA builds schedule update with scheduledArrival", () => {
    const etaLocal = "2026-05-14T18:30";
    const payload = buildScheduleUpdateFromDestinationEta(baseTrip, etaLocal);
    expect(payload).not.toBeNull();
    expect(payload?.scheduledDeparture).toContain("2026-05-14");
    expect(payload?.scheduledArrival).toBeDefined();
    expect(payload).not.toHaveProperty("stops");
    expect(validateUpdateTripApiPayload(payload!)).toEqual({ ok: true });
  });

  it("F9e: empty destination ETA returns null (does not clear arrival)", () => {
    expect(buildScheduleUpdateFromDestinationEta(baseTrip, "")).toBeNull();
    expect(buildScheduleUpdateFromDestinationEta(baseTrip, "   ")).toBeNull();
    expect(buildScheduleUpdateFromDestinationEta(baseTrip, undefined)).toBeNull();
    expect(buildScheduleUpdateFromDestinationEta(baseTrip, null)).toBeNull();
  });

  it("F9e: same instant as trip.scheduledArrival skips update", () => {
    const sameLocal = utcIsoToLocalInput(
      baseTrip.scheduledArrival!.toISOString(),
    );
    expect(buildScheduleUpdateFromDestinationEta(baseTrip, sameLocal)).toBeNull();
  });
});

describe("isDestinationEtaAfterDeparture (F9g)", () => {
  const departure = new Date("2026-05-14T12:00:00.000Z");

  it("fails when ETA is before departure", () => {
    const beforeLocal = utcIsoToLocalInput("2026-05-14T11:00:00.000Z");
    expect(isDestinationEtaAfterDeparture(beforeLocal, departure)).toBe(false);
  });

  it("fails when ETA equals departure", () => {
    const sameLocal = utcIsoToLocalInput(departure.toISOString());
    expect(isDestinationEtaAfterDeparture(sameLocal, departure)).toBe(false);
  });

  it("passes when ETA is after departure", () => {
    const afterLocal = utcIsoToLocalInput("2026-05-14T13:00:00.000Z");
    expect(isDestinationEtaAfterDeparture(afterLocal, departure)).toBe(true);
  });

  it("round-trips local input through the same converter used by projection", () => {
    const afterLocal = "2026-05-14T18:30";
    expect(
      new Date(localInputToUtcIso(afterLocal)).getTime(),
    ).toBeGreaterThan(departure.getTime());
    expect(isDestinationEtaAfterDeparture(afterLocal, departure)).toBe(true);
    expect(DESTINATION_ETA_MUST_BE_AFTER_DEPARTURE).toContain(
      "posterior a la de salida",
    );
  });
});

describe("resolveStopAddressForApi", () => {
  it("keeps existing address if length >= 5", () => {
    const result = resolveStopAddressForApi({
      address: "Av. Central 1234",
    } as any);
    expect(result).toBe("Av. Central 1234");
  });

  it("uses locationName if length >= 5 when address is empty (e.g. MUNDO DULCE)", () => {
    const result = resolveStopAddressForApi({
      address: "",
      locationName: "MUNDO DULCE",
    } as any);
    expect(result).toBe("MUNDO DULCE");
  });

  it("formats short locationName (< 5 chars) with Ubicacion prefix", () => {
    const result = resolveStopAddressForApi({
      address: "",
      locationName: "GDL",
    } as any);
    expect(result).toBe("Ubicación GDL");
    expect(result.length).toBeGreaterThanOrEqual(5);
  });

  it("combines structured street and number if address is empty", () => {
    const result = resolveStopAddressForApi({
      address: "",
      street: "Blvd. Miguel Aleman",
      exteriorNumber: "100",
    } as any);
    expect(result).toBe("Blvd. Miguel Aleman #100");
    expect(result.length).toBeGreaterThanOrEqual(5);
  });

  it("uses SAT territorial code fallback if completely empty", () => {
    const result = resolveStopAddressForApi({
      address: "",
      satEstadoCode: "MEX",
      satMunicipioCode: "106",
    } as any);
    expect(result).toBe("Ubicación MEX-106");
  });

  it("returns fallback guaranteed >= 5 chars if no fields present", () => {
    const result = resolveStopAddressForApi({} as any);
    expect(result).toBe("Ubicación de parada");
    expect(result.length).toBeGreaterThanOrEqual(5);
  });
});
