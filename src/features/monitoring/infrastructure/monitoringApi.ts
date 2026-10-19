/**
 * Monitoring / GPS tracking API client.
 */

import {
  apiClient,
  type ApiSingleResponse,
} from "@shared/api";
import type {
  FleetHistory,
  FleetHistoryQuery,
  FleetPositions,
  GpsAlertMarkReadResult,
  GpsAlertSettings,
  GpsAlertSettingsUpdateItem,
  GpsAlertsList,
  GpsAlertsQuery,
  GpsAlertsSummary,
  GpsDeviceInfo,
  GpsDeviceLinkResult,
  GpsDeviceUnlinkResult,
  LinkGpsDevicePayload,
  ReverseGeocodeResult,
} from "../domain";
import {
  mapFleetHistory,
  mapFleetPositions,
  mapGpsAlertMarkRead,
  mapGpsAlertSettings,
  mapGpsAlertsList,
  mapGpsAlertsSummary,
  mapGpsDeviceInfo,
  mapGpsDeviceLinkResult,
  mapGpsDeviceUnlinkResult,
  mapReverseGeocode,
  type ApiFleetHistoryResponse,
  type ApiFleetPositionsResponse,
  type ApiGpsAlertMarkReadResponse,
  type ApiGpsAlertSettingsResponse,
  type ApiGpsAlertsListEnvelope,
  type ApiGpsAlertsSummaryResponse,
  type ApiGpsDeviceInfoResponse,
  type ApiGpsDeviceLinkCreatedResponse,
  type ApiGpsDeviceUnlinkResponse,
  type ApiReverseGeocodeResponse,
} from "./mappers";

export const monitoringApi = {
  getFleetPositions: async (): Promise<FleetPositions> => {
    const raw = await apiClient.get<
      ApiSingleResponse<ApiFleetPositionsResponse>
    >("/monitoring/fleet/positions");
    return mapFleetPositions(raw.data);
  },

  getFleetHistory: async (
    vehicleId: string,
    query: FleetHistoryQuery,
  ): Promise<FleetHistory> => {
    const raw = await apiClient.get<
      ApiSingleResponse<ApiFleetHistoryResponse>
    >(`/monitoring/fleet/${encodeURIComponent(vehicleId)}/history`, {
      params: { from: query.from, to: query.to },
    });
    return mapFleetHistory(raw.data);
  },

  reverseGeocode: async (
    lat: number,
    lon: number,
  ): Promise<ReverseGeocodeResult> => {
    const raw = await apiClient.get<
      ApiSingleResponse<ApiReverseGeocodeResponse>
    >("/monitoring/geocode/reverse", {
      params: { lat, lon },
    });
    return mapReverseGeocode(raw.data);
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

  getAlertSettings: async (): Promise<GpsAlertSettings> => {
    const raw = await apiClient.get<
      ApiSingleResponse<ApiGpsAlertSettingsResponse>
    >("/monitoring/alert-settings");
    return mapGpsAlertSettings(raw.data);
  },

  putAlertSettings: async (
    settings: GpsAlertSettingsUpdateItem[],
  ): Promise<{ data: GpsAlertSettings; message?: string }> => {
    const raw = await apiClient.put<
      ApiSingleResponse<ApiGpsAlertSettingsResponse>
    >("/monitoring/alert-settings", {
      settings: settings.map((s) => ({
        alert_type: s.alertType,
        enabled: s.enabled,
        threshold_value: s.thresholdValue,
      })),
    });
    return {
      data: mapGpsAlertSettings(raw.data),
      message: raw.message,
    };
  },

  getAlerts: async (query: GpsAlertsQuery = {}): Promise<GpsAlertsList> => {
    const raw = await apiClient.get<ApiGpsAlertsListEnvelope>(
      "/monitoring/alerts",
      {
        params: {
          from: query.from,
          to: query.to,
          alert_type: query.alertType,
          vehicle_id: query.vehicleId,
          unread_only: query.unreadOnly,
          page: query.page,
          page_size: query.pageSize,
        },
      },
    );
    return mapGpsAlertsList(raw.data, raw.pagination);
  },

  getAlertsSummary: async (): Promise<GpsAlertsSummary> => {
    const raw = await apiClient.get<
      ApiSingleResponse<ApiGpsAlertsSummaryResponse>
    >("/monitoring/alerts/summary");
    return mapGpsAlertsSummary(raw.data);
  },

  markAlertRead: async (
    alertId: string,
  ): Promise<{ data: GpsAlertMarkReadResult; message?: string }> => {
    const raw = await apiClient.post<
      ApiSingleResponse<ApiGpsAlertMarkReadResponse>
    >(`/monitoring/alerts/${encodeURIComponent(alertId)}/read`);
    return {
      data: mapGpsAlertMarkRead(raw.data),
      message: raw.message,
    };
  },
};
