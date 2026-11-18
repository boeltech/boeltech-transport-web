/**
 * F8c — clasifica hits Mapbox de «solo ciudad» (D-F8c-2).
 * Preferir Sheet (lugar) si el hit es ambiguo o tipado como calle/POI.
 */

import type { GeocodingCandidate } from "@shared/geolocation/contracts/geoPorts";

import type { LocationValue } from "./LocationField.types";

const CITY_FEATURE_TYPES = new Set(["place", "region", "locality"]);
const PLACE_FEATURE_TYPES = new Set([
  "address",
  "poi",
  "poi.landmark",
  "street",
  "neighborhood",
]);

export function isMapboxCityCandidate(
  candidate: GeocodingCandidate | null | undefined,
): boolean {
  if (!candidate) return false;
  const types = (candidate.featureTypes ?? []).map((t) => t.toLowerCase());
  if (types.length === 0) return false;
  if (types.some((t) => PLACE_FEATURE_TYPES.has(t))) return false;
  return types.some((t) => CITY_FEATURE_TYPES.has(t));
}

/** Label de card/reserva: `{Ciudad}, {Estado}` cuando Mapbox trae place/region. */
export function cityLabelFromMapboxCandidate(
  candidate: GeocodingCandidate,
): string {
  const place = candidate.place?.trim();
  const region = candidate.region?.trim();
  if (place && region) return `${place}, ${region}`;
  if (place) return place;
  const fromLabel = candidate.label.split(",")[0]?.trim();
  return fromLabel || candidate.label.trim();
}

export function cityOnlyLocationValueFromMapbox(
  candidate: GeocodingCandidate,
): LocationValue {
  const place = candidate.place?.trim() || null;
  const label = cityLabelFromMapboxCandidate(candidate);
  return {
    locationName: label,
    localityName: place,
  };
}

/**
 * Card «Solo ciudad»: nombre sin evidencia de lugar (coords+CP, calle, catálogo).
 * No relaja put-ready — solo tipifica el value ya city-only.
 */
export function isCityOnlyLocationValue(
  value: LocationValue | null | undefined,
): boolean {
  if (!value) return false;
  const name = value.locationName?.trim();
  if (!name) return false;
  if (value.sourceAddressId?.trim()) return false;

  const lat = value.latitude;
  const lng = value.longitude;
  const hasCoords =
    lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);
  const hasCp = /^\d{5}$/.test(value.postalCode?.trim() ?? "");
  if (hasCoords || hasCp) return false;
  if (value.street?.trim()) return false;
  if (
    value.geocodingAccuracy === "manual" ||
    value.geocodingAccuracy === "exact" ||
    value.geocodingAccuracy === "approximate"
  ) {
    return false;
  }
  return true;
}
