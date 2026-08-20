/**
 * Mappers snake_case → camelCase para corridors / route-estimate (ADR-0078 F2).
 * Tipos Api* viven solo aquí.
 */
import { Currency, StopType, type StopTypeValue } from "@features/trips/domain";
import type {
  ClientCorridor,
  CorridorStopSnapshot,
  RouteEstimate,
} from "@features/trips/domain";
export { mapSnapshotToCreateStops } from "@features/trips/domain";

export interface ApiCorridorStopSnapshot {
  sequence_order: number;
  stop_type: string[];
  source_address_id?: string | null;
  address?: string | null;
  city: string;
  state?: string | null;
  postal_code?: string | null;
  location_name?: string | null;
  street?: string | null;
  exterior_number?: string | null;
  interior_number?: string | null;
  colonia?: string | null;
  reference?: string | null;
  sat_country_code?: string | null;
  sat_state_code?: string | null;
  sat_municipality_code?: string | null;
  sat_locality_code?: string | null;
  sat_neighborhood_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rfc_remitente_destinatario?: string | null;
  nombre_remitente_destinatario?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
}

export interface ApiCorridorResponse {
  corridor_key: string;
  origin_city: string;
  origin_state: string | null;
  destination_city: string;
  destination_state: string | null;
  stop_count: number;
  trip_count: number;
  last_used_at: string;
  sample_trip_id: string;
  stops_snapshot: ApiCorridorStopSnapshot[];
}

export interface ApiRouteEstimateResponse {
  fuel_estimate: number;
  toll_estimate: number;
  total_estimate: number;
  currency: "MXN";
  based_on_trips: number;
  estimated_distance_km: number | null;
  vehicle_efficiency_km_l: number | null;
  adjusted: boolean;
  disclaimer: string;
}

const STOP_TYPE_VALUES = new Set<string>(Object.values(StopType));

function optionalString(
  value: string | null | undefined,
): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function optionalNumber(
  value: number | null | undefined,
): number | undefined {
  return value == null ? undefined : value;
}

function mapStopType(raw: string[]): StopTypeValue[] {
  return raw.filter((item): item is StopTypeValue => STOP_TYPE_VALUES.has(item));
}

export function mapApiCorridorStopSnapshot(
  raw: ApiCorridorStopSnapshot,
): CorridorStopSnapshot {
  const snapshot: CorridorStopSnapshot = {
    sequenceOrder: raw.sequence_order,
    stopType: mapStopType(raw.stop_type),
    city: raw.city,
  };

  const sourceAddressId = optionalString(raw.source_address_id);
  if (sourceAddressId) snapshot.sourceAddressId = sourceAddressId;
  const address = optionalString(raw.address);
  if (address) snapshot.address = address;
  const state = optionalString(raw.state);
  if (state) snapshot.state = state;
  const postalCode = optionalString(raw.postal_code);
  if (postalCode) snapshot.postalCode = postalCode;
  const locationName = optionalString(raw.location_name);
  if (locationName) snapshot.locationName = locationName;
  const street = optionalString(raw.street);
  if (street) snapshot.street = street;
  const exteriorNumber = optionalString(raw.exterior_number);
  if (exteriorNumber) snapshot.exteriorNumber = exteriorNumber;
  const interiorNumber = optionalString(raw.interior_number);
  if (interiorNumber) snapshot.interiorNumber = interiorNumber;
  const colonia = optionalString(raw.colonia);
  if (colonia) snapshot.colonia = colonia;
  const reference = optionalString(raw.reference);
  if (reference) snapshot.reference = reference;
  const satCountryCode = optionalString(raw.sat_country_code);
  if (satCountryCode) snapshot.satCountryCode = satCountryCode;
  const satStateCode = optionalString(raw.sat_state_code);
  if (satStateCode) snapshot.satStateCode = satStateCode;
  const satMunicipalityCode = optionalString(raw.sat_municipality_code);
  if (satMunicipalityCode) snapshot.satMunicipalityCode = satMunicipalityCode;
  const satLocalityCode = optionalString(raw.sat_locality_code);
  if (satLocalityCode) snapshot.satLocalityCode = satLocalityCode;
  const satNeighborhoodCode = optionalString(raw.sat_neighborhood_code);
  if (satNeighborhoodCode) snapshot.satNeighborhoodCode = satNeighborhoodCode;
  const latitude = optionalNumber(raw.latitude);
  if (latitude !== undefined) snapshot.latitude = latitude;
  const longitude = optionalNumber(raw.longitude);
  if (longitude !== undefined) snapshot.longitude = longitude;
  const rfc = optionalString(raw.rfc_remitente_destinatario);
  if (rfc) snapshot.rfcRemitenteDestinatario = rfc;
  const nombre = optionalString(raw.nombre_remitente_destinatario);
  if (nombre) snapshot.nombreRemitenteDestinatario = nombre;
  const contactName = optionalString(raw.contact_name);
  if (contactName) snapshot.contactName = contactName;
  const contactPhone = optionalString(raw.contact_phone);
  if (contactPhone) snapshot.contactPhone = contactPhone;

  return snapshot;
}

export function mapApiCorridor(raw: ApiCorridorResponse): ClientCorridor {
  return {
    corridorKey: raw.corridor_key,
    originCity: raw.origin_city,
    originState: raw.origin_state,
    destinationCity: raw.destination_city,
    destinationState: raw.destination_state,
    stopCount: raw.stop_count,
    tripCount: raw.trip_count,
    lastUsedAt: raw.last_used_at,
    sampleTripId: raw.sample_trip_id,
    stopsSnapshot: raw.stops_snapshot.map(mapApiCorridorStopSnapshot),
  };
}

export function mapApiRouteEstimate(
  raw: ApiRouteEstimateResponse,
): RouteEstimate {
  return {
    fuelEstimate: raw.fuel_estimate,
    tollEstimate: raw.toll_estimate,
    totalEstimate: raw.total_estimate,
    currency: Currency.MXN,
    basedOnTrips: raw.based_on_trips,
    estimatedDistanceKm: raw.estimated_distance_km,
    vehicleEfficiencyKmL: raw.vehicle_efficiency_km_l,
    adjusted: raw.adjusted,
    disclaimer: raw.disclaimer,
  };
}
