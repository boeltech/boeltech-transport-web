import { describe, expect, it, vi } from "vitest";

import type { CreateTripInput, ITripRepository } from "@features/trips/domain";
import { CreateTripUseCase } from "./CreateTripUseCase";

function validCreateInput(): CreateTripInput {
  return {
    vehicleId: "11111111-1111-4111-8111-111111111111",
    driverId: "22222222-2222-4222-8222-222222222222",
    scheduledDeparture: "2030-05-10T12:00:00.000Z",
    originCity: "Guadalajara",
    destinationCity: "CDMX",
    stops: [
      {
        sequenceOrder: 0,
        stopType: ["origin"],
        address: "Calle 1",
        city: "Guadalajara",
        postalCode: "44100",
        satStateCode: "JAL",
        satMunicipalityCode: "039",
      },
      {
        sequenceOrder: 1,
        stopType: ["destination"],
        address: "Calle 2",
        city: "CDMX",
        postalCode: "01000",
        satStateCode: "CMX",
        satMunicipalityCode: "002",
      },
    ],
  };
}

describe("CreateTripUseCase schedule validation", () => {
  it("permite scheduledDeparture de un día calendario anterior a hoy", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);
    const arrival = new Date(yesterday);
    arrival.setHours(18, 0, 0, 0);

    const createResult = {
      trip: { id: "trip-1" },
      summary: {
        tripId: "trip-1",
        tripCode: "V-001",
        stopsCreated: 2,
        cargosCreated: 0,
        expensesCreated: 0,
        finalStatus: "draft",
      },
    };
    const repository = {
      create: vi.fn().mockResolvedValue(createResult),
    } as unknown as ITripRepository;
    const useCase = new CreateTripUseCase(repository);

    const input = {
      ...validCreateInput(),
      scheduledDeparture: yesterday.toISOString(),
      scheduledArrival: arrival.toISOString(),
    };
    const result = await useCase.execute(input);

    expect(result.success).toBe(true);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(input);
  });
});

describe("CreateTripUseCase route validation", () => {
  it("rechaza alta sin resumen de destino", async () => {
    const repository = {
      create: vi.fn(),
    } as unknown as ITripRepository;
    const useCase = new CreateTripUseCase(repository);

    const result = await useCase.execute({
      ...validCreateInput(),
      destinationCity: "",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("DESTINATION_REQUIRED");
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("rechaza alta sin parada destination cuando envía stops", async () => {
    const repository = {
      create: vi.fn(),
    } as unknown as ITripRepository;
    const useCase = new CreateTripUseCase(repository);

    const result = await useCase.execute({
      ...validCreateInput(),
      stops: [
        {
          sequenceOrder: 0,
          stopType: ["origin"],
          address: "Calle 1",
          city: "Guadalajara",
          postalCode: "44100",
          satStateCode: "JAL",
          satMunicipalityCode: "039",
        },
      ],
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("MISSING_DESTINATION_STOP");
    expect(repository.create).not.toHaveBeenCalled();
  });
});
