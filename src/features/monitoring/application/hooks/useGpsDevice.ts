import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  monitoringQueryKeys,
  type GpsDeviceLinkResult,
  type GpsDeviceUnlinkResult,
  type LinkGpsDevicePayload,
} from "../../domain";
import { monitoringApi } from "../../infrastructure";

type MutationCallbacks<T> = {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
};

export function useGpsDevice(
  vehicleId: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: monitoringQueryKeys.gpsDevice(vehicleId),
    queryFn: () => monitoringApi.getGpsDevice(vehicleId),
    enabled: (options?.enabled ?? true) && Boolean(vehicleId),
    staleTime: 30_000,
  });
}

export function useLinkGpsDevice(
  vehicleId: string,
  callbacks?: MutationCallbacks<GpsDeviceLinkResult>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: LinkGpsDevicePayload) =>
      monitoringApi.linkGpsDevice(vehicleId, payload),
    onSuccess: (result) => {
      void qc.invalidateQueries({
        queryKey: monitoringQueryKeys.gpsDevice(vehicleId),
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

export function useUnlinkGpsDevice(
  vehicleId: string,
  callbacks?: MutationCallbacks<GpsDeviceUnlinkResult>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => monitoringApi.unlinkGpsDevice(vehicleId),
    onSuccess: (result) => {
      void qc.invalidateQueries({
        queryKey: monitoringQueryKeys.gpsDevice(vehicleId),
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
