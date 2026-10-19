/**
 * Monitoring / GPS fleet — domain entities (camelCase).
 * Contrato API: TEC F2 gps-tracking-monitoreo.
 */

export const GpsPositionStatus = {
  ONLINE: "online",
  STALE: "stale",
  OFFLINE: "offline",
} as const;

export type GpsPositionStatusType =
  (typeof GpsPositionStatus)[keyof typeof GpsPositionStatus];

export interface FleetVehiclePosition {
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

export interface GpsDeviceLastPosition {
  latitude: number;
  longitude: number;
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

export const FLEET_MAP_PATH = "/monitoring/fleet";

export const monitoringQueryKeys = {
  all: ["monitoring"] as const,
  fleetPositions: () => [...monitoringQueryKeys.all, "fleet-positions"] as const,
  gpsDevice: (vehicleId: string) =>
    [...monitoringQueryKeys.all, "gps-device", vehicleId] as const,
} as const;
