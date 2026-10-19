/**
 * Monitoring / GPS fleet — domain entities (camelCase).
 * Contrato API: TEC F2 gps-tracking corte 2 (§4.0–4.4).
 */

export const GpsPositionStatus = {
  ONLINE: "online",
  STALE: "stale",
  OFFLINE: "offline",
} as const;

export type GpsPositionStatusType =
  (typeof GpsPositionStatus)[keyof typeof GpsPositionStatus];

export const GpsMovementStatus = {
  MOVING: "moving",
  STOPPED: "stopped",
} as const;

export type GpsMovementStatusType =
  (typeof GpsMovementStatus)[keyof typeof GpsMovementStatus];

export const GpsAddressStatus = {
  OK: "ok",
  UNAVAILABLE: "unavailable",
  SKIPPED: "skipped",
} as const;

export type GpsAddressStatusType =
  (typeof GpsAddressStatus)[keyof typeof GpsAddressStatus];

/** Fragmento de paridad §4.0 (enrich live). */
export interface GpsParityFields {
  movementStatus: GpsMovementStatusType | null;
  satellites: number | null;
  batteryPct: number | null;
  phone: string | null;
  odometerKm: number | null;
  address: string | null;
  addressStatus: GpsAddressStatusType;
}

export interface FleetVehiclePosition extends GpsParityFields {
  vehicleId: string;
  vehicleEconomicNumber: string;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  imei: string;
  latitude: number | null;
  longitude: number | null;
  altitudeM: number | null;
  speedKmh: number | null;
  courseDeg: number | null;
  recordedAt: string | null;
  source: "traccar";
  stale: boolean;
  status: GpsPositionStatusType;
  /** Unread alerts 7 d (F4); UI F6. */
  unreadAlertCount?: number;
}

export interface FleetPositionsSummary {
  totalLinked: number;
  online: number;
  stale: number;
  offline: number;
}

export interface FleetPositions {
  positions: FleetVehiclePosition[];
  summary: FleetPositionsSummary;
  fetchedAt: string;
}

export interface GpsDeviceLastPosition extends GpsParityFields {
  latitude: number;
  longitude: number;
  altitudeM: number | null;
  speedKmh: number | null;
  courseDeg: number | null;
  recordedAt: string;
  stale: boolean;
  status: GpsPositionStatusType;
}

export interface GpsDeviceLinked {
  linked: true;
  imei: string;
  traccarDeviceId: string | null;
  linkedAt: string;
  linkedByName: string | null;
  lastPosition: GpsDeviceLastPosition | null;
}

export interface GpsDeviceUnlinked {
  linked: false;
}

export type GpsDeviceInfo = GpsDeviceLinked | GpsDeviceUnlinked;

export interface GpsDeviceLinkResult {
  id: string;
  vehicleId: string;
  imei: string;
  traccarDeviceId: string;
  linkedAt: string;
  linkedByName: string | null;
}

export interface GpsDeviceUnlinkResult {
  vehicleId: string;
  imei: string;
  unlinkedAt: string;
}

export interface LinkGpsDevicePayload {
  imei: string;
}

/** Punto de historial (§4.3) — sin address masivo. */
export interface FleetHistoryPoint {
  seq: number;
  latitude: number;
  longitude: number;
  speedKmh: number | null;
  courseDeg: number | null;
  recordedAt: string;
  movementStatus: GpsMovementStatusType | null;
  satellites: number | null;
  batteryPct: number | null;
  odometerKm: number | null;
}

export interface FleetHistory {
  vehicleId: string;
  imei: string;
  from: string;
  to: string;
  rawPointCount: number;
  pointCount: number;
  sampled: boolean;
  points: FleetHistoryPoint[];
  fetchedAt: string;
}

export interface FleetHistoryQuery {
  from: string;
  to: string;
}

export interface ReverseGeocodeResult {
  latitude: number;
  longitude: number;
  address: string | null;
  addressStatus: GpsAddressStatusType;
  cacheHit: boolean;
}

export const FLEET_MAP_PATH = "/monitoring/fleet";
export const ALERTS_LIST_PATH = "/monitoring/alerts";
export const ALERT_SETTINGS_PATH = "/monitoring/settings";

export function fleetHistoryPath(vehicleId: string): string {
  return `/monitoring/fleet/history/${encodeURIComponent(vehicleId)}`;
}

export function fleetMapFocusPath(vehicleId: string): string {
  return `${FLEET_MAP_PATH}?vehicleId=${encodeURIComponent(vehicleId)}`;
}

/** Max rango historial UI (D14 / TEC §4.3). */
export const HISTORY_MAX_RANGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Default periodo al abrir historial (D15). */
export const HISTORY_DEFAULT_HOURS = 4;

/** Retención UI alertas (D26 / TEC §4.7). */
export const ALERTS_WINDOW_DAYS = 7;

export const GpsAlertType = {
  OVERSPEED: "overspeed",
  LONG_STOP: "long_stop",
  SIGNAL_LOST: "signal_lost",
  LOW_BATTERY: "low_battery",
  GEOFENCE_EXIT: "geofence_exit",
} as const;

export type GpsAlertTypeCode =
  (typeof GpsAlertType)[keyof typeof GpsAlertType];

export const GPS_ALERT_TYPES: readonly GpsAlertTypeCode[] = [
  GpsAlertType.OVERSPEED,
  GpsAlertType.LONG_STOP,
  GpsAlertType.SIGNAL_LOST,
  GpsAlertType.LOW_BATTERY,
  GpsAlertType.GEOFENCE_EXIT,
];

export const GpsAlertSettingStatus = {
  ACTIVE: "active",
  DISABLED: "disabled",
  UNCONFIGURED: "unconfigured",
} as const;

export type GpsAlertSettingStatusType =
  (typeof GpsAlertSettingStatus)[keyof typeof GpsAlertSettingStatus];

export interface GpsAlertSetting {
  alertType: GpsAlertTypeCode;
  enabled: boolean;
  thresholdValue: number | null;
  thresholdUnit: string | null;
  configurable: boolean;
  status: GpsAlertSettingStatusType;
  unconfiguredReason?: "no_geofences";
}

export interface GpsAlertSettings {
  settings: GpsAlertSetting[];
  geofenceCount: number;
}

export interface GpsAlertSettingsUpdateItem {
  alertType: GpsAlertTypeCode;
  enabled: boolean;
  thresholdValue: number | null;
}

export interface GpsAlert {
  id: string;
  alertType: GpsAlertTypeCode;
  vehicleId: string;
  vehicleEconomicNumber: string;
  vehiclePlate: string;
  title: string;
  description: string;
  occurredAt: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  addressStatus: GpsAddressStatusType;
  readAt: string | null;
  payload: Record<string, unknown>;
}

export interface GpsAlertsPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface GpsAlertsList {
  items: GpsAlert[];
  pagination: GpsAlertsPagination;
}

export interface GpsAlertsQuery {
  from?: string;
  to?: string;
  alertType?: GpsAlertTypeCode;
  vehicleId?: string;
  unreadOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface GpsAlertsSummary {
  unreadCount: number;
  windowDays: number;
}

export interface GpsAlertMarkReadResult {
  id: string;
  readAt: string;
}

export const monitoringQueryKeys = {
  all: ["monitoring"] as const,
  fleetPositions: () => [...monitoringQueryKeys.all, "fleet-positions"] as const,
  gpsDevice: (vehicleId: string) =>
    [...monitoringQueryKeys.all, "gps-device", vehicleId] as const,
  fleetHistory: (vehicleId: string, from: string, to: string) =>
    [...monitoringQueryKeys.all, "fleet-history", vehicleId, from, to] as const,
  reverseGeocode: (lat: number, lon: number) =>
    [...monitoringQueryKeys.all, "reverse-geocode", lat, lon] as const,
  alertSettings: () => [...monitoringQueryKeys.all, "alert-settings"] as const,
  alerts: (queryKey: string) =>
    [...monitoringQueryKeys.all, "alerts", queryKey] as const,
  alertsSummary: () => [...monitoringQueryKeys.all, "alerts-summary"] as const,
} as const;
