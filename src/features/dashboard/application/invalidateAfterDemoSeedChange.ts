/**
 * After demo seed apply/purge: refresh activation + master listados.
 */

import type { QueryClient } from "@tanstack/react-query";

import { clientQueryKeys } from "@features/clients/domain";
import { driverQueryKeys } from "@features/drivers/domain";
import { employeeQueryKeys } from "@features/employees/application";
import { tripQueryKeys } from "@features/trips/domain";
import { vehicleQueryKeys } from "@features/vehicles/domain";

import { dashboardQueryKeys } from "./dashboardQueryKeys";

export function invalidateAfterDemoSeedChange(
  queryClient: QueryClient,
): void {
  void queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all });
  void queryClient.invalidateQueries({ queryKey: clientQueryKeys.all });
  void queryClient.invalidateQueries({ queryKey: vehicleQueryKeys.all });
  void queryClient.invalidateQueries({ queryKey: driverQueryKeys.all });
  void queryClient.invalidateQueries({ queryKey: tripQueryKeys.all });
  void queryClient.invalidateQueries({ queryKey: employeeQueryKeys.all });
}
