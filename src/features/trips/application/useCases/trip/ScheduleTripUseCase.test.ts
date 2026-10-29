import { describe, expect, it, vi } from "vitest";

import type { ITripRepository, Trip } from "@features/trips/domain";
import { TripStatus } from "@features/trips/domain";
import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { FLEET_AVAILABILITY_CONFLICT_CODE } from "@shared/api/errors/fleetAvailabilityConflictError";
import { ScheduleTripUseCase } from "./ScheduleTripUseCase";

function draftTrip(over: Partial<Trip> = {}): Trip {
  return {
    id: "trip-1",
    tenantId: "tenant-1",
    tripCode: "TRP-1",
    vehicleId: "11111111-1111-4111-8111-111111111111",
    driverId: "22222222-2222-4222-8222-222222222222",
    clientId: null,
    originBranchId: null,
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
    operationalOutcome: "standard",
    falseTripDeclaredAt: null,
    falseTripDeclaredBy: null,
    notes: null,
    cancellationReason: null,
    invoicing: tripInvoicingFixture(),
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
        data: draftTrip({
          originCity: "",
          mileage: { start: 10_000, end: null },
          costs: {
            baseRate: 35_000,
            fuelCost: 0,
            tollCost: 0,
            otherCosts: 0,
            totalCost: 35_000,
          },
        }),
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
    const scheduled = draftTrip({
      status: TripStatus.SCHEDULED,
      mileage: { start: 12_000, end: null },
      costs: {
        baseRate: 35_000,
        fuelCost: 0,
        tollCost: 0,
        otherCosts: 0,
        totalCost: 35_000,
      },
    });
    const repository = {
      findById: vi.fn().mockResolvedValue({
        data: draftTrip({
          mileage: { start: 12_000, end: null },
          costs: {
            baseRate: 35_000,
            fuelCost: 0,
            tollCost: 0,
            otherCosts: 0,
            totalCost: 35_000,
          },
        }),
      }),
      updateStatus: vi.fn().mockResolvedValue({ data: scheduled }),
    } as unknown as ITripRepository;
    const useCase = new ScheduleTripUseCase(repository);

    const result = await useCase.execute("trip-1");

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.trip).toEqual(scheduled);
    expect(result.data.warnings).toBeUndefined();
    expect(repository.updateStatus).toHaveBeenCalledWith("trip-1", {
      status: TripStatus.SCHEDULED,
    });
  });

  it("propaga warnings soft de updateStatus (0071 E2)", async () => {
    const scheduled = draftTrip({
      status: TripStatus.SCHEDULED,
      mileage: { start: 12_000, end: null },
      costs: {
        baseRate: 35_000,
        fuelCost: 0,
        tollCost: 0,
        otherCosts: 0,
        totalCost: 35_000,
      },
    });
    const repository = {
      findById: vi.fn().mockResolvedValue({
        data: draftTrip({
          mileage: { start: 12_000, end: null },
          costs: {
            baseRate: 35_000,
            fuelCost: 0,
            tollCost: 0,
            otherCosts: 0,
            totalCost: 35_000,
          },
        }),
      }),
      updateStatus: vi.fn().mockResolvedValue({
        data: scheduled,
        warnings: [
          {
            code: "VEHICLE_OVERLAP_SOFT",
            message: "El vehículo ya está asignado al viaje TRP-DRAFT",
          },
        ],
      }),
    } as unknown as ITripRepository;
    const useCase = new ScheduleTripUseCase(repository);

    const result = await useCase.execute("trip-1");

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.trip.status).toBe(TripStatus.SCHEDULED);
    expect(result.data.warnings).toEqual([
      expect.objectContaining({
        code: "VEHICLE_OVERLAP_SOFT",
        message: "El vehículo ya está asignado al viaje TRP-DRAFT",
      }),
    ]);
  });

  it("rechaza programar sin kilometraje inicial", async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue({
        data: draftTrip({
          mileage: { start: null, end: null },
          costs: {
            baseRate: 35_000,
            fuelCost: 0,
            tollCost: 0,
            otherCosts: 0,
            totalCost: 35_000,
          },
        }),
      }),
      updateStatus: vi.fn(),
    } as unknown as ITripRepository;
    const useCase = new ScheduleTripUseCase(repository);

    const result = await useCase.execute("trip-1");

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("SCHEDULE_NOT_READY");
    expect(result.error.message).toMatch(/kilometraje inicial/i);
    expect(repository.updateStatus).not.toHaveBeenCalled();
  });

  it("rechaza programar sin base_rate (ADR-0071)", async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue({ data: draftTrip() }),
      updateStatus: vi.fn(),
    } as unknown as ITripRepository;
    const useCase = new ScheduleTripUseCase(repository);

    const result = await useCase.execute("trip-1");

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("SCHEDULE_NOT_READY");
    expect(repository.updateStatus).not.toHaveBeenCalled();
  });

  it("preserva code + details de FLEET_AVAILABILITY_CONFLICT (0071 hard)", async () => {
    const conflicts = [
      {
        resource_type: "vehicle",
        resource_id: "veh-1",
        display_label: "UNI-01",
        conflicting_trip_code: "TR-PEER",
        conflict_kind: "fleet_overlap",
      },
    ];
    const repository = {
      findById: vi.fn().mockResolvedValue({
        data: draftTrip({
          mileage: { start: 12_000, end: null },
          costs: {
            baseRate: 35_000,
            fuelCost: 0,
            tollCost: 0,
            otherCosts: 0,
            totalCost: 35_000,
          },
        }),
      }),
      updateStatus: vi.fn().mockRejectedValue(
        new ApiError(
          "Hay 1 conflicto de disponibilidad de flota. Reasigna o cambia fechas.",
          400,
          FLEET_AVAILABILITY_CONFLICT_CODE,
          { conflicts },
        ),
      ),
    } as unknown as ITripRepository;
    const useCase = new ScheduleTripUseCase(repository);

    const result = await useCase.execute("trip-1");

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe(FLEET_AVAILABILITY_CONFLICT_CODE);
    expect(result.error.details).toEqual({ conflicts });
  });
});
