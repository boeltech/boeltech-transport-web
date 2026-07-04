import type { QueryClient } from "@tanstack/react-query";
import { driverQueryKeys } from "@features/drivers/domain";
import type { TripCorrectionEntry } from "@features/invoicing/domain";
import { vehicleQueryKeys } from "@features/vehicles/domain";
import type { Trip } from "@features/trips/domain";
import { tripQueryKeys } from "@features/trips/domain";

type FiscalTripCorrectionLike = Pick<
  TripCorrectionEntry,
  "tripId" | "driverId" | "vehicleId"
>;

/**
 * Invalida detalle de vehículo/conductor y tab Viajes tras corrección fiscal
 * (sustitución defer o apply-now). ADR-0058.
 */
export async function invalidateFiscalCorrectionResources(
  queryClient: QueryClient,
  tripCorrections: readonly FiscalTripCorrectionLike[] | undefined,
): Promise<void> {
  if (!tripCorrections?.length) {
    return;
  }

  const vehicleIds = new Set<string>();
  const driverIds = new Set<string>();

  for (const entry of tripCorrections) {
    if (entry.vehicleId) {
      vehicleIds.add(entry.vehicleId);
    }
    if (entry.driverId) {
      driverIds.add(entry.driverId);
    }

    if (!entry.tripId) {
      continue;
    }

    const cachedTrip = queryClient.getQueryData<Trip>(
      tripQueryKeys.detail(entry.tripId),
    );
    if (cachedTrip?.vehicleId) {
      vehicleIds.add(cachedTrip.vehicleId);
    }
    if (cachedTrip?.driverId) {
      driverIds.add(cachedTrip.driverId);
    }
  }

  const invalidations: Promise<void>[] = [];

  for (const vehicleId of vehicleIds) {
    invalidations.push(
      queryClient.invalidateQueries({
        queryKey: vehicleQueryKeys.detail(vehicleId),
      }),
    );
  }

  for (const driverId of driverIds) {
    invalidations.push(
      queryClient.invalidateQueries({
        queryKey: driverQueryKeys.trips(driverId),
      }),
      queryClient.invalidateQueries({
        queryKey: driverQueryKeys.stats(driverId),
      }),
    );
  }

  if (vehicleIds.size > 0) {
    invalidations.push(
      queryClient.invalidateQueries({ queryKey: vehicleQueryKeys.lists() }),
      queryClient.invalidateQueries({ queryKey: vehicleQueryKeys.assignable() }),
    );
  }

  await Promise.all(invalidations);
}
