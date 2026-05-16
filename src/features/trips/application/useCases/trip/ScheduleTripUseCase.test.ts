import { describe, expect, it, vi } from "vitest";

import type { ITripRepository, Trip } from "@features/trips/domain";
import { TripStatus } from "@features/trips/domain";
import { ScheduleTripUseCase } from "./ScheduleTripUseCase";

function draftTrip(over: Partial<Trip> = {}): Trip {
  return {
    id: "trip-1",
    tenantId: "tenant-1",
    tripCode: "TRP-1",
    vehicleId: "11111111-1111-4111-8111-111111111111",
    driverId: "22222222-2222-4222-8222-222222222222",
    clientId: null,
    scheduledDeparture: new Date("2030-05-10T12:00:00.000Z"),
    scheduledArrival: new Date("2030-05-11T12:00:00.000Z"),
    actualDeparture: null,
    actualArrival: null,
    mileage: { start: null, end: null },
    originCity: "Guadalajara",
    originState: "JAL",
    destinationCity: "CDMX",
    destinationState: "CMX",
    cargo: {
      description: null,
      weight: null,
      volume: null,
      units: null,
      value: null,
    },
    costs: {
      baseRate: 0,
      fuelCost: 0,
      tollCost: 0,
      otherCosts: 0,
      totalCost: 0,
    },
    detailedCosts: null,
    profitability: null,
    status: TripStatus.DRAFT,
    notes: null,
    cancellationReason: null,
    invoicing: {
      hasActiveInvoice: false,
      canGenerateInvoice: false,
      invoiceId: null,
      invoiceFolio: null,
      invoiceCfdiUuid: null,
      invoiceStatus: null,
      blockReason: null,
    },
    requiresFiscalAttention: false,
    fiscalActionRequired: null,
    totalDistRec: null,
    idCcp: null,
    cfdiDocumentIntent: "ingreso",
    createdAt: new Date("2030-05-01T12:00:00.000Z"),
    updatedAt: new Date("2030-05-01T12:00:00.000Z"),
    createdBy: null,
    updatedBy: null,
    createdByName: null,
    updatedByName: null,
    ...over,
  };
}

describe("ScheduleTripUseCase route validation", () => {
  it("rechaza programar sin resumen de origen", async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue({
        data: draftTrip({ originCity: "" }),
      }),
      updateStatus: vi.fn(),
    } as unknown as ITripRepository;
    const useCase = new ScheduleTripUseCase(repository);

    const result = await useCase.execute("trip-1");

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("MISSING_ROUTE");
    expect(repository.updateStatus).not.toHaveBeenCalled();
  });

  it("programa viaje con resumen de ruta válido", async () => {
    const scheduled = draftTrip({ status: TripStatus.SCHEDULED });
    const repository = {
      findById: vi.fn().mockResolvedValue({ data: draftTrip() }),
      updateStatus: vi.fn().mockResolvedValue({ data: scheduled }),
    } as unknown as ITripRepository;
    const useCase = new ScheduleTripUseCase(repository);

    const result = await useCase.execute("trip-1");

    expect(result.success).toBe(true);
    expect(repository.updateStatus).toHaveBeenCalledWith("trip-1", {
      status: TripStatus.SCHEDULED,
    });
  });
});
