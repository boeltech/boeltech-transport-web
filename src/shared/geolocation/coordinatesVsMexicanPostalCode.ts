import { estimateRoadDistanceKm } from "@shared/utils/geoUtils";
import type { LatLng } from "@shared/geolocation/contracts/geoPorts";
import { fetchPostalCodeReference } from "@shared/geolocation/infrastructure/postalCodeReferenceApi";

/** Distancia estimada (km) a partir de la cual mostramos advertencia operativa. */
export const CP_COORDINATES_WARNING_THRESHOLD_KM = 100;

export interface PostalCodeGeocodeReference {
  readonly label: string;
  readonly position: LatLng;
  readonly query: string;
  readonly resolutionSource: string;
  readonly confidence: "high" | "low";
}

export interface CoordinatesPostalCodeWarningDetails {
  readonly distanceKm: number;
  readonly postalCode: string;
  readonly reference: PostalCodeGeocodeReference;
}

export function isMexicanPostalCodeForWarning(
  postalCode: unknown,
  countryCode: unknown,
): boolean {
  const cp = String(postalCode ?? "").trim();
  const country = String(countryCode ?? "MEX")
    .trim()
    .toUpperCase();
  return (country === "MEX" || country === "MX") && /^\d{5}$/.test(cp);
}

export function parseCoordinateValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function isDistanceFarFromPostalCodeReference(
  distanceKm: number | null,
  thresholdKm = CP_COORDINATES_WARNING_THRESHOLD_KM,
): boolean {
  return distanceKm != null && distanceKm > thresholdKm;
}

export async function resolveMexicanPostalCodeReference(input: {
  postalCode: string;
  proximity?: LatLng;
  satStateCode?: string | null;
  satMunicipalityCode?: string | null;
}): Promise<PostalCodeGeocodeReference | null> {
  const result = await fetchPostalCodeReference({
    postalCode: input.postalCode,
    proximity: input.proximity,
    satStateCode: input.satStateCode,
    satMunicipalityCode: input.satMunicipalityCode,
  });
  if (!result || result.confidence === "low") {
    return null;
  }
  return {
    label: result.label,
    position: result.position,
    query: result.queryUsed,
    resolutionSource: result.resolutionSource,
    confidence: result.confidence,
  };
}

export async function evaluateCoordinatesVsMexicanPostalCodeWarning(input: {
  postalCode: string;
  satCountryCode?: string | null;
  satStateCode?: string | null;
  satMunicipalityCode?: string | null;
  latitude: number;
  longitude: number;
  thresholdKm?: number;
}): Promise<CoordinatesPostalCodeWarningDetails | null> {
  if (
    !isMexicanPostalCodeForWarning(input.postalCode, input.satCountryCode)
  ) {
    return null;
  }

  const capturedPosition: LatLng = {
    latitude: input.latitude,
    longitude: input.longitude,
  };

  const reference = await resolveMexicanPostalCodeReference({
    postalCode: input.postalCode,
    proximity: capturedPosition,
    satStateCode: input.satStateCode,
    satMunicipalityCode: input.satMunicipalityCode,
  });
  if (!reference) {
    return null;
  }

  const distanceKm = estimateRoadDistanceKm(
    reference.position.latitude,
    reference.position.longitude,
    input.latitude,
    input.longitude,
  );

  if (
    !isDistanceFarFromPostalCodeReference(distanceKm, input.thresholdKm)
  ) {
    return null;
  }

  return {
    distanceKm: distanceKm!,
    postalCode: input.postalCode.trim(),
    reference,
  };
}
