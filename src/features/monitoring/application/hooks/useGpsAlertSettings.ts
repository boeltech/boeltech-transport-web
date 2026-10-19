import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  monitoringQueryKeys,
  type GpsAlertSettings,
  type GpsAlertSettingsUpdateItem,
} from "../../domain";
import { monitoringApi } from "../../infrastructure";

export function useGpsAlertSettings(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: monitoringQueryKeys.alertSettings(),
    queryFn: () => monitoringApi.getAlertSettings(),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
}

export function useUpdateGpsAlertSettings(callbacks?: {
  onSuccess?: (data: GpsAlertSettings) => void;
  onError?: (error: Error) => void;
}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: GpsAlertSettingsUpdateItem[]) =>
      monitoringApi.putAlertSettings(settings),
    onSuccess: (result) => {
      void qc.invalidateQueries({
        queryKey: monitoringQueryKeys.alertSettings(),
      });
      callbacks?.onSuccess?.(result.data);
    },
    onError: (error: Error) => {
      callbacks?.onError?.(error);
    },
  });
}
