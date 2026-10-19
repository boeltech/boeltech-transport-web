/**
 * GPS monitoring mappers — snake_case API → camelCase domain.
 */

import type {
  FleetHistory,
  FleetHistoryPoint,
  FleetPositions,
  FleetVehiclePosition,
  GpsAddressStatusType,
  GpsAlert,
  GpsAlertMarkReadResult,
  GpsAlertSetting,
  GpsAlertSettings,
  GpsAlertSettingStatusType,
  GpsAlertsList,
  GpsAlertsSummary,
  GpsAlertTypeCode,
  GpsDeviceInfo,
  GpsDeviceLastPosition,
  GpsDeviceLinkResult,
  GpsDeviceUnlinkResult,
  GpsMovementStatusType,
  GpsPositionStatusType,
  ReverseGeocodeResult,
} from "../domain";
import { GPS_ALERT_TYPES } from "../domain";

export interface ApiParityFragment {
  movement_status?: string | null;
  satellites?: number | null;
  battery_pct?: number | null;
  phone?: string | null;
  odometer_km?: number | null;
  address?: string | null;
  address_status?: string | null;
}

export interface ApiFleetVehiclePosition extends ApiParityFragment {
  vehicle_id: string;
  vehicle_economic_number: string;
  vehicle_plate: string;
  vehicle_brand: string;
  vehicle_model: string;
  imei: string;
  latitude: number | null;
  longitude: number | null;
  altitude_m: number | null;
  speed_kmh: number | null;
  course_deg: number | null;
  recorded_at: string | null;
  source: "traccar";
  stale: boolean;
  status: string;
  unread_alert_count?: number;
}

export interface ApiFleetPositionsResponse {
  positions: ApiFleetVehiclePosition[];
  summary: {
    total_linked: number;
    online: number;
    stale: number;
    offline: number;
  };
  fetched_at: string;
}

export interface ApiGpsDeviceLastPosition extends ApiParityFragment {
  latitude: number;
  longitude: number;
  altitude_m?: number | null;
  speed_kmh: number | null;
  course_deg: number | null;
  recorded_at: string;
  stale: boolean;
  status: string;
}

export interface ApiGpsDeviceLinkedResponse {
  linked: true;
  imei: string;
  traccar_device_id: string | null;
  linked_at: string;
  linked_by_name: string | null;
  last_position: ApiGpsDeviceLastPosition | null;
}

export interface ApiGpsDeviceUnlinkedResponse {
  linked: false;
}

export type ApiGpsDeviceInfoResponse =
  | ApiGpsDeviceLinkedResponse
  | ApiGpsDeviceUnlinkedResponse;

export interface ApiGpsDeviceLinkCreatedResponse {
  id: string;
  vehicle_id: string;
  imei: string;
  traccar_device_id: string;
  linked_at: string;
  linked_by_name: string | null;
}

export interface ApiGpsDeviceUnlinkResponse {
  vehicle_id: string;
  imei: string;
  unlinked_at: string;
}

export interface ApiFleetHistoryPoint {
  seq: number;
  latitude: number;
  longitude: number;
  speed_kmh: number | null;
  course_deg: number | null;
  recorded_at: string;
  movement_status: string | null;
  satellites: number | null;
  battery_pct: number | null;
  odometer_km: number | null;
}

export interface ApiFleetHistoryResponse {
  vehicle_id: string;
  imei: string;
  from: string;
  to: string;
  raw_point_count: number;
  point_count: number;
  sampled: boolean;
  points: ApiFleetHistoryPoint[];
  fetched_at: string;
}

export interface ApiReverseGeocodeResponse {
  latitude: number;
  longitude: number;
  address: string | null;
  address_status: string;
  cache_hit: boolean;
}

function asStatus(value: string): GpsPositionStatusType {
  if (value === "online" || value === "stale" || value === "offline") {
    return value;
  }
  return "offline";
}

function asMovement(
  value: string | null | undefined,
): GpsMovementStatusType | null {
  if (value === "moving" || value === "stopped") return value;
  return null;
}

function asAddressStatus(
  value: string | null | undefined,
): GpsAddressStatusType {
  if (value === "ok" || value === "unavailable" || value === "skipped") {
    return value;
  }
  return "skipped";
}

function mapParity(raw: ApiParityFragment) {
  return {
    movementStatus: asMovement(raw.movement_status),
    satellites: raw.satellites ?? null,
    batteryPct: raw.battery_pct ?? null,
    phone: raw.phone ?? null,
    odometerKm: raw.odometer_km ?? null,
    address: raw.address ?? null,
    addressStatus: asAddressStatus(raw.address_status),
  };
}

export function mapFleetVehiclePosition(
  raw: ApiFleetVehiclePosition,
): FleetVehiclePosition {
  return {
    vehicleId: raw.vehicle_id,
    vehicleEconomicNumber: raw.vehicle_economic_number,
    vehiclePlate: raw.vehicle_plate,
    vehicleBrand: raw.vehicle_brand,
    vehicleModel: raw.vehicle_model,
    imei: raw.imei,
    latitude: raw.latitude,
    longitude: raw.longitude,
    altitudeM: raw.altitude_m,
    speedKmh: raw.speed_kmh,
    courseDeg: raw.course_deg,
    recordedAt: raw.recorded_at,
    source: "traccar",
    stale: raw.stale,
    status: asStatus(raw.status),
    unreadAlertCount: raw.unread_alert_count ?? 0,
    ...mapParity(raw),
  };
}

export function mapFleetPositions(
  raw: ApiFleetPositionsResponse,
): FleetPositions {
  return {
    positions: raw.positions.map(mapFleetVehiclePosition),
    summary: {
      totalLinked: raw.summary.total_linked,
      online: raw.summary.online,
      stale: raw.summary.stale,
      offline: raw.summary.offline,
    },
    fetchedAt: raw.fetched_at,
  };
}

function mapLastPosition(
  raw: ApiGpsDeviceLastPosition,
): GpsDeviceLastPosition {
  return {
    latitude: raw.latitude,
    longitude: raw.longitude,
    altitudeM: raw.altitude_m ?? null,
    speedKmh: raw.speed_kmh,
    courseDeg: raw.course_deg,
    recordedAt: raw.recorded_at,
    stale: raw.stale,
    status: asStatus(raw.status),
    ...mapParity(raw),
  };
}

export function mapGpsDeviceInfo(
  raw: ApiGpsDeviceInfoResponse,
): GpsDeviceInfo {
  if (!raw.linked) {
    return { linked: false };
  }
  return {
    linked: true,
    imei: raw.imei,
    traccarDeviceId: raw.traccar_device_id,
    linkedAt: raw.linked_at,
    linkedByName: raw.linked_by_name,
    lastPosition: raw.last_position
      ? mapLastPosition(raw.last_position)
      : null,
  };
}

export function mapGpsDeviceLinkResult(
  raw: ApiGpsDeviceLinkCreatedResponse,
): GpsDeviceLinkResult {
  return {
    id: raw.id,
    vehicleId: raw.vehicle_id,
    imei: raw.imei,
    traccarDeviceId: raw.traccar_device_id,
    linkedAt: raw.linked_at,
    linkedByName: raw.linked_by_name,
  };
}

export function mapGpsDeviceUnlinkResult(
  raw: ApiGpsDeviceUnlinkResponse,
): GpsDeviceUnlinkResult {
  return {
    vehicleId: raw.vehicle_id,
    imei: raw.imei,
    unlinkedAt: raw.unlinked_at,
  };
}

export function mapFleetHistoryPoint(
  raw: ApiFleetHistoryPoint,
): FleetHistoryPoint {
  return {
    seq: raw.seq,
    latitude: raw.latitude,
    longitude: raw.longitude,
    speedKmh: raw.speed_kmh,
    courseDeg: raw.course_deg,
    recordedAt: raw.recorded_at,
    movementStatus: asMovement(raw.movement_status),
    satellites: raw.satellites,
    batteryPct: raw.battery_pct,
    odometerKm: raw.odometer_km,
  };
}

export function mapFleetHistory(raw: ApiFleetHistoryResponse): FleetHistory {
  return {
    vehicleId: raw.vehicle_id,
    imei: raw.imei,
    from: raw.from,
    to: raw.to,
    rawPointCount: raw.raw_point_count,
    pointCount: raw.point_count,
    sampled: raw.sampled,
    points: raw.points.map(mapFleetHistoryPoint),
    fetchedAt: raw.fetched_at,
  };
}

export function mapReverseGeocode(
  raw: ApiReverseGeocodeResponse,
): ReverseGeocodeResult {
  return {
    latitude: raw.latitude,
    longitude: raw.longitude,
    address: raw.address,
    addressStatus: asAddressStatus(raw.address_status),
    cacheHit: raw.cache_hit,
  };
}

export interface ApiGpsAlertSettingItem {
  alert_type: string;
  enabled: boolean;
  threshold_value: number | null;
  threshold_unit: string | null;
  configurable: boolean;
  status: string;
  unconfigured_reason?: "no_geofences";
}

export interface ApiGpsAlertSettingsResponse {
  settings: ApiGpsAlertSettingItem[];
  geofence_count: number;
}

export interface ApiGpsAlertListItem {
  id: string;
  alert_type: string;
  vehicle_id: string;
  vehicle_economic_number: string;
  vehicle_plate: string;
  title: string;
  description: string;
  occurred_at: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  address_status: string;
  read_at: string | null;
  payload: Record<string, unknown>;
}

export interface ApiGpsAlertsListEnvelope {
  data: ApiGpsAlertListItem[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

export interface ApiGpsAlertsSummaryResponse {
  unread_count: number;
  window_days: number;
}

export interface ApiGpsAlertMarkReadResponse {
  id: string;
  read_at: string;
}

function asAlertType(value: string): GpsAlertTypeCode {
  if ((GPS_ALERT_TYPES as readonly string[]).includes(value)) {
    return value as GpsAlertTypeCode;
  }
  return "overspeed";
}

function asSettingStatus(value: string): GpsAlertSettingStatusType {
  if (value === "active" || value === "disabled" || value === "unconfigured") {
    return value;
  }
  return "disabled";
}

export function mapGpsAlertSetting(
  raw: ApiGpsAlertSettingItem,
): GpsAlertSetting {
  return {
    alertType: asAlertType(raw.alert_type),
    enabled: raw.enabled,
    thresholdValue: raw.threshold_value,
    thresholdUnit: raw.threshold_unit,
    configurable: raw.configurable,
    status: asSettingStatus(raw.status),
    unconfiguredReason: raw.unconfigured_reason,
  };
}

export function mapGpsAlertSettings(
  raw: ApiGpsAlertSettingsResponse,
): GpsAlertSettings {
  return {
    settings: raw.settings.map(mapGpsAlertSetting),
    geofenceCount: raw.geofence_count,
  };
}

export function mapGpsAlert(raw: ApiGpsAlertListItem): GpsAlert {
  return {
    id: raw.id,
    alertType: asAlertType(raw.alert_type),
    vehicleId: raw.vehicle_id,
    vehicleEconomicNumber: raw.vehicle_economic_number,
    vehiclePlate: raw.vehicle_plate,
    title: raw.title,
    description: raw.description,
    occurredAt: raw.occurred_at,
    latitude: raw.latitude,
    longitude: raw.longitude,
    address: raw.address,
    addressStatus: asAddressStatus(raw.address_status),
    readAt: raw.read_at,
    payload: raw.payload ?? {},
  };
}

export function mapGpsAlertsList(
  items: ApiGpsAlertListItem[],
  pagination: ApiGpsAlertsListEnvelope["pagination"],
): GpsAlertsList {
  return {
    items: items.map(mapGpsAlert),
    pagination: {
      page: pagination.page,
      pageSize: pagination.page_size,
      total: pagination.total,
      totalPages: pagination.total_pages,
    },
  };
}

export function mapGpsAlertsSummary(
  raw: ApiGpsAlertsSummaryResponse,
): GpsAlertsSummary {
  return {
    unreadCount: raw.unread_count,
    windowDays: raw.window_days,
  };
}

export function mapGpsAlertMarkRead(
  raw: ApiGpsAlertMarkReadResponse,
): GpsAlertMarkReadResult {
  return {
    id: raw.id,
    readAt: raw.read_at,
  };
}
