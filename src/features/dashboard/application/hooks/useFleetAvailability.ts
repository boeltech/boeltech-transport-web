import { useQuery } from "@tanstack/react-query";
import { usePermissions } from "@shared/permissions";
import { dashboardApi } from "../../infrastructure/dashboardApi";
import { dashboardQueryKeys } from "../dashboardQueryKeys";

const STALE_TIME = 30_000;

/** GET /dashboard/fleet-availability — «Disponibles ahora» (libre operativo). */
export function useFleetAvailability(options?: { enabled?: boolean }) {
  const { hasPermission } = usePermissions();
  const canReadDashboard = hasPermission("dashboard", "read");

  return useQuery({
    queryKey: dashboardQueryKeys.fleetAvailability(),
    queryFn: () => dashboardApi.getFleetAvailability(),
    enabled: canReadDashboard && (options?.enabled ?? true),
    staleTime: STALE_TIME,
  });
}
