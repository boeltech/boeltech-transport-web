import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  monitoringQueryKeys,
  type GpsAlertMarkReadResult,
  type GpsAlertsQuery,
} from "../../domain";
import { monitoringApi } from "../../infrastructure";

function alertsQueryKey(query: GpsAlertsQuery): string {
  return [
    query.from ?? "",
    query.to ?? "",
    query.alertType ?? "",
    query.vehicleId ?? "",
    query.unreadOnly === true ? "1" : "0",
    String(query.page ?? 1),
    String(query.pageSize ?? 50),
  ].join("|");
}

export function useGpsAlerts(
  query: GpsAlertsQuery = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: monitoringQueryKeys.alerts(alertsQueryKey(query)),
    queryFn: () => monitoringApi.getAlerts(query),
    enabled: options?.enabled ?? true,
    staleTime: 15_000,
  });
}

export function useGpsAlertsSummary(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: monitoringQueryKeys.alertsSummary(),
    queryFn: () => monitoringApi.getAlertsSummary(),
    enabled: options?.enabled ?? true,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useMarkAlertRead(callbacks?: {
  onSuccess?: (data: GpsAlertMarkReadResult) => void;
  onError?: (error: Error) => void;
}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) => monitoringApi.markAlertRead(alertId),
    onSuccess: (result) => {
      void qc.invalidateQueries({
        queryKey: [...monitoringQueryKeys.all, "alerts"],
      });
      void qc.invalidateQueries({
        queryKey: monitoringQueryKeys.alertsSummary(),
      });
      void qc.invalidateQueries({
        queryKey: monitoringQueryKeys.fleetPositions(),
      });
      callbacks?.onSuccess?.(result.data);
    },
    onError: (error: Error) => {
      callbacks?.onError?.(error);
    },
  });
}
