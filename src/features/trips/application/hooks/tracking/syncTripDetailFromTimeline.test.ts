import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import {
  TripStatus,
  tripQueryKeys,
  type Trip,
} from "@features/trips/domain";

import {
  applyTripDetailTrackingPatch,
  buildTripDetailPatchFromTrackingEvent,
} from "./syncTripDetailFromTimeline";

function baseTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: "trip-1",
    tenantId: "tenant-1",
    tripCode: "TRP-1",
    scheduledDeparture: new Date("2026-06-06T10:00:00Z"),
    scheduledArrival: null,
    actualDeparture: new Date("2026-06-06T10:05:00Z"),
    actualArrival: null,
    mileage: { start: 100_000, end: null },
    originCity: "QRO",
    originState: "QRO",
    destinationCity: "CDMX",
    destinationState: "CDMX",
    cargo: { totalWeight: 0, totalUnits: 0, itemCount: 0 },
    costs: {
      baseRate: 0,
      fuelCost: 0,
      tollCost: 0,
      driverCost: 0,
      otherCosts: 0,
      totalCost: 0,
    },
    detailedCosts: null,
    profitability: null,
    status: TripStatus.IN_PROGRESS,
    notes: null,
    cancellationReason: null,
    invoicing: {
      invoiceId: null,
      invoiceStatus: null,
      canGenerateInvoice: false,
    },
    requiresFiscalAttention: false,
    fiscalActionRequired: null,
    totalDistRec: null,
    idCcp: null,
    cfdiDocumentIntent: "ingreso",
    createdAt: new Date(),
    updatedAt: new Date(),
    stops: [],
    ...overrides,
  } as Trip;
}

describe("buildTripDetailPatchFromTrackingEvent", () => {
  it("parchea odómetro final y estado al cerrar viaje", () => {
    const patch = buildTripDetailPatchFromTrackingEvent({
      eventType: "trip_arrived",
      occurredAt: "2026-06-06T18:00:00Z",
      mileage: 101_150,
    });

    expect(patch).toEqual({
      status: TripStatus.COMPLETED,
      mileageEnd: 101_150,
      actualArrival: new Date("2026-06-06T18:00:00Z"),
    });
  });
});

describe("applyTripDetailTrackingPatch", () => {
  it("actualiza mileage.end en caché del detalle", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(tripQueryKeys.detail("trip-1"), baseTrip());

    applyTripDetailTrackingPatch(queryClient, "trip-1", {
      status: TripStatus.COMPLETED,
      mileageEnd: 101_150,
      actualArrival: new Date("2026-06-06T18:00:00Z"),
    });

    const cached = queryClient.getQueryData<Trip>(tripQueryKeys.detail("trip-1"));
    expect(cached?.status).toBe(TripStatus.COMPLETED);
    expect(cached?.mileage.end).toBe(101_150);
    expect(cached?.mileage.start).toBe(100_000);
  });
});
