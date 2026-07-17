import { useQuery } from "@tanstack/react-query";
import { type VehicleListItem } from "@features/vehicles/domain";
import { vehiclesApi } from "@features/vehicles/infrastructure";

export const branchVehicleQueryKeys = {
  byBranch: (branchId: string) => ["branches", "vehicles", branchId] as const,
};

/**
 * Lista vehículos activos asignados a una sucursal (SUC-M21).
 * Reutiliza vehiclesApi (GET /vehicles?branch_id=); key propia para no
 * colisionar con el shape paginado de useVehicles.
 */
export function useBranchVehicles(branchId: string) {
  return useQuery({
    queryKey: branchVehicleQueryKeys.byBranch(branchId),
    queryFn: async (): Promise<VehicleListItem[]> => {
      const result = await vehiclesApi.getAll({
        filters: { branchId, isActive: true },
        page: 1,
        limit: 100,
        sort: { field: "unit_number", direction: "asc" },
      });
      return result.data;
    },
    enabled: Boolean(branchId),
    staleTime: 30_000,
  });
}
