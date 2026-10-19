import { useQuery } from "@tanstack/react-query";
import { monitoringQueryKeys } from "../../domain";
import { monitoringApi } from "../../infrastructure";

const POLL_MS = 30_000;

export function useFleetPositions(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: monitoringQueryKeys.fleetPositions(),
    queryFn: () => monitoringApi.getFleetPositions(),
    enabled: options?.enabled ?? true,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
    staleTime: POLL_MS,
    placeholderData: (previous) => previous,
  });
}
