import type { QueryClient } from "@tanstack/react-query";

import { driverQueryKeys } from "@features/drivers/domain";
import { vehicleQueryKeys } from "@features/vehicles/domain";

/**
 * Refresca listas de vehículo/conductor usadas al asignar recursos en el wizard de viajes.
 */
export function invalidateTripAssignmentResources(
  queryClient: QueryClient,
): Promise<void> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: vehicleQueryKeys.assignable() }),
    queryClient.invalidateQueries({ queryKey: driverQueryKeys.available() }),
    queryClient.invalidateQueries({ queryKey: driverQueryKeys.lists() }),
  ]).then(() => undefined);
}
