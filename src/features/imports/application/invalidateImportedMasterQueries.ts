/**
 * Tras commit de import CSV, refresca listados del padrón afectado
 * (el job de imports no invalida clients/employees/…).
 */

import type { QueryClient } from "@tanstack/react-query";
import { clientQueryKeys } from "@features/clients";
import { employeeQueryKeys } from "@features/employees";
import { vehicleQueryKeys } from "@features/vehicles";
import { driverQueryKeys } from "@features/drivers";
import type { ImportImplementedEntityType } from "../domain";

export function invalidateImportedMasterQueries(
  queryClient: QueryClient,
  entityType: ImportImplementedEntityType,
): void {
  switch (entityType) {
    case "clients":
      void queryClient.invalidateQueries({ queryKey: clientQueryKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: clientQueryKeys.active() });
      break;
    case "addresses":
      // Direcciones viven bajo detalle de dueño (cliente/empleado).
      void queryClient.invalidateQueries({ queryKey: clientQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: employeeQueryKeys.all });
      break;
    case "employees":
      void queryClient.invalidateQueries({
        queryKey: employeeQueryKeys.lists(),
      });
      void queryClient.invalidateQueries({
        queryKey: [...employeeQueryKeys.all, "available-for-driver"],
      });
      break;
    case "vehicles":
      void queryClient.invalidateQueries({ queryKey: vehicleQueryKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: vehicleQueryKeys.assignable(),
      });
      break;
    case "drivers":
      void queryClient.invalidateQueries({ queryKey: driverQueryKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: driverQueryKeys.available(),
      });
      void queryClient.invalidateQueries({
        queryKey: [...employeeQueryKeys.all, "available-for-driver"],
      });
      break;
    default: {
      const _exhaustive: never = entityType;
      void _exhaustive;
    }
  }
}
