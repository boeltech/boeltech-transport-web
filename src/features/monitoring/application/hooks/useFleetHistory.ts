import { useQuery } from "@tanstack/react-query";
import { monitoringQueryKeys, type FleetHistoryQuery } from "../../domain";
import { monitoringApi } from "../../infrastructure";

export function useFleetHistory(
  vehicleId: string | undefined,
  range: FleetHistoryQuery | null,
  options?: { enabled?: boolean },
) {
  const enabled =
    (options?.enabled ?? true) &&
    Boolean(vehicleId) &&
    range != null &&
    Boolean(range.from) &&
    Boolean(range.to);

  return useQuery({
    queryKey: monitoringQueryKeys.fleetHistory(
      vehicleId ?? "",
      range?.from ?? "",
      range?.to ?? "",
    ),
    queryFn: () => monitoringApi.getFleetHistory(vehicleId!, range!),
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
