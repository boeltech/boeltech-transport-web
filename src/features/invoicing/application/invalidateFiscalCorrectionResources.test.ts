import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { driverQueryKeys } from "@features/drivers/domain";
import { vehicleQueryKeys } from "@features/vehicles/domain";
import { tripQueryKeys } from "@features/trips/domain";
import { invalidateFiscalCorrectionResources } from "./invalidateFiscalCorrectionResources";

describe("invalidateFiscalCorrectionResources", () => {
  it("invalidates old and new vehicle/driver queries from corrections and trip cache", async () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

    const tripId = "trip-1";
    const oldVehicleId = "vehicle-old";
    const newVehicleId = "vehicle-new";
    const oldDriverId = "driver-old";
    const newDriverId = "driver-new";

    queryClient.setQueryData(tripQueryKeys.detail(tripId), {
      id: tripId,
      vehicleId: oldVehicleId,
      driverId: oldDriverId,
    });

    await invalidateFiscalCorrectionResources(queryClient, [
      {
        tripId,
        vehicleId: newVehicleId,
        driverId: newDriverId,
      },
    ]);

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: vehicleQueryKeys.detail(oldVehicleId),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: vehicleQueryKeys.detail(newVehicleId),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: driverQueryKeys.trips(oldDriverId),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: driverQueryKeys.trips(newDriverId),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: driverQueryKeys.stats(oldDriverId),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: driverQueryKeys.stats(newDriverId),
    });
  });
});
