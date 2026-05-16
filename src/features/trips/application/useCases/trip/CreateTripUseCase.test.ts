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
