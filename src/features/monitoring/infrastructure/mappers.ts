/**
 * GPS monitoring mappers — snake_case API → camelCase domain.
 */

import type {
  FleetPositions,
  FleetVehiclePosition,
  GpsDeviceInfo,
  GpsDeviceLastPosition,
  GpsDeviceLinkResult,
  GpsDeviceUnlinkResult,
  GpsPositionStatusType,
} from "../domain";

export interface ApiFleetVehiclePosition {
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

export interface ApiGpsDeviceLastPosition {
  latitude: number;
  longitude: number;
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

function asStatus(value: string): GpsPositionStatusType {
  if (value === "online" || value === "stale" || value === "offline") {
    return value;
  }
  return "offline";
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
    speedKmh: raw.speed_kmh,
    courseDeg: raw.course_deg,
    recordedAt: raw.recorded_at,
    stale: raw.stale,
    status: asStatus(raw.status),
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
