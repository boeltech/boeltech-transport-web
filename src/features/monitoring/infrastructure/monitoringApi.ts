/**
 * Monitoring / GPS tracking API client.
 */

import {
  apiClient,
  type ApiSingleResponse,
} from "@shared/api";
import type {
  FleetPositions,
  GpsDeviceInfo,
  GpsDeviceLinkResult,
  GpsDeviceUnlinkResult,
  LinkGpsDevicePayload,
} from "../domain";
import {
  mapFleetPositions,
  mapGpsDeviceInfo,
  mapGpsDeviceLinkResult,
  mapGpsDeviceUnlinkResult,
  type ApiFleetPositionsResponse,
  type ApiGpsDeviceInfoResponse,
  type ApiGpsDeviceLinkCreatedResponse,
  type ApiGpsDeviceUnlinkResponse,
} from "./mappers";

export const monitoringApi = {
  getFleetPositions: async (): Promise<FleetPositions> => {
    const raw = await apiClient.get<
      ApiSingleResponse<ApiFleetPositionsResponse>
    >("/monitoring/fleet/positions");
    return mapFleetPositions(raw.data);
  },

  getGpsDevice: async (vehicleId: string): Promise<GpsDeviceInfo> => {
    const raw = await apiClient.get<
      ApiSingleResponse<ApiGpsDeviceInfoResponse>
    >(`/vehicles/${vehicleId}/gps/device`);
    return mapGpsDeviceInfo(raw.data);
  },

  linkGpsDevice: async (
    vehicleId: string,
    payload: LinkGpsDevicePayload,
  ): Promise<{ data: GpsDeviceLinkResult; message?: string }> => {
    const raw = await apiClient.post<
      ApiSingleResponse<ApiGpsDeviceLinkCreatedResponse>
    >(`/vehicles/${vehicleId}/gps/device`, payload);
    return {
      data: mapGpsDeviceLinkResult(raw.data),
      message: raw.message,
    };
  },

  unlinkGpsDevice: async (
    vehicleId: string,
  ): Promise<{ data: GpsDeviceUnlinkResult; message?: string }> => {
    const raw = await apiClient.delete<
      ApiSingleResponse<ApiGpsDeviceUnlinkResponse>
    >(`/vehicles/${vehicleId}/gps/device`);
    return {
      data: mapGpsDeviceUnlinkResult(raw.data),
      message: raw.message,
    };
  },
};
