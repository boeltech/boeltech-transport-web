import { describe, expect, it } from "vitest";

import { TripStatus } from "@features/trips/domain";

import { buildTripJourneyStripModel } from "./buildTripJourneyStripModel";

function makeTrip(overrides: Record<string, unknown> = {}) {
  const scheduledDeparture = new Date("2026-11-14T14:00:00.000Z");
  const scheduledArrival = new Date("2026-11-14T19:30:00.000Z");
  return {
    id: "t1",
    tripCode: "TLX-1",
    status: TripStatus.SCHEDULED,
    scheduledDeparture,
    scheduledArrival,
    actualDeparture: null,
    actualArrival: null,
    costs: { baseRate: 24000 },
    cfdiEmissionIntent: "emitir_cfdi",
    invoicing: { invoiceStatus: null, invoiceId: null },
    vehicle: { unitNumber: "TR-118", licensePlate: "52-BC-7D" },
    driver: { fullName: "Ana Méndez" },
    trailers: [],
    mileage: { start: 100, end: null },
    totalDistRec: 338,
    createdAt: new Date("2026-11-13T16:00:00.000Z"),
    statusHistory: [],
    ...overrides,
  } as never;
}

describe("buildTripJourneyStripModel", () => {
  it("Q8 Programado overdue: Salida Ya pasó · sin salir; Llegada Ya pasó", () => {
    const nowMs = new Date("2026-11-15T12:00:00.000Z").getTime();
    const model = buildTripJourneyStripModel({
      trip: makeTrip(),
      status: TripStatus.SCHEDULED,
      orderedStops: [],
      cargoCount: 1,
      distanceKm: 338,
      durationLabel: null,
      nowMs,
    });

    const departure = model.facts.find((f) => f.id === "departure");
    const arrival = model.facts.find((f) => f.id === "arrival");
    expect(departure?.detail).toBe("Ya pasó · sin salir");
    expect(departure?.tone).toBe("warning");
    expect(arrival?.detail).toBe("Ya pasó");
    expect(arrival?.tone).toBe("warning");
  });

  it("incluye 4 fases + 6 datos en Programado", () => {
    const model = buildTripJourneyStripModel({
      trip: makeTrip(),
      status: TripStatus.SCHEDULED,
      orderedStops: [],
      cargoCount: 0,
      distanceKm: 100,
      durationLabel: null,
      nowMs: new Date("2026-11-13T12:00:00.000Z").getTime(),
    });
    expect(model.phases).toHaveLength(4);
    expect(model.facts).toHaveLength(6);
    expect(model.phases.find((p) => p.id === "scheduled")?.state).toBe(
      "current",
    );
  });

  it("F8c AmbosCiudad: Recorrido Solo ciudades cuando draft sin stops", () => {
    const model = buildTripJourneyStripModel({
      trip: makeTrip({
        status: TripStatus.DRAFT,
        originCity: "Monterrey",
        destinationCity: "Torreón",
        costs: { baseRate: null },
        vehicle: null,
        driver: null,
        totalDistRec: null,
      }),
      status: TripStatus.DRAFT,
      orderedStops: [],
      cargoCount: 0,
      distanceKm: null,
      durationLabel: null,
      nowMs: new Date("2026-11-13T12:00:00.000Z").getTime(),
    });
    const route = model.facts.find((f) => f.id === "route");
    expect(route?.value).toBe("Faltan origen y destino");
    expect(route?.detail).toBe("Solo ciudades");
    expect(route?.tone).toBe("missing");
  });
});
