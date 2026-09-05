/**
 * Map LocationValue ↔ flat SAT/geo address fields for form prefill (ADR-0092 F4+).
 */

import type { GeocodingAccuracy } from "@shared/location/geocodingAccuracy";

import type { LocationValue } from "./LocationField.types";

function shortSatCode(code: string | null | undefined): string | null {
  if (code == null) return null;
  const normalized = code.trim();
  if (!normalized) return null;
  const parts = normalized.split("-").filter(Boolean);
  return (parts[parts.length - 1] ?? normalized).trim();
}

/** Flat SAT/geo bag shared by client/branch (and similar) address forms. */
export interface LocationSatAddressFields {
  locationName: string;
  street: string;
  exteriorNumber: string;
  interiorNumber: string | null;
  reference: string | null;
  postalCode: string;
  satCountryCode: string;
  satStateCode: string;
  satMunicipalityCode: string;
  satLocalityCode: string | null;
  localityName: string | null;
  satNeighborhoodCode: string | null;
  neighborhoodName: string | null;
  latitude: number | null;
  longitude: number | null;
  geocodingAccuracy: GeocodingAccuracy | null;
}

export function emptySatAddressFields(): LocationSatAddressFields {
  return {
    locationName: "",
    street: "",
    exteriorNumber: "",
    interiorNumber: null,
    reference: null,
    postalCode: "",
    satCountryCode: "MEX",
    satStateCode: "",
    satMunicipalityCode: "",
    satLocalityCode: null,
    localityName: null,
    satNeighborhoodCode: null,
    neighborhoodName: null,
    latitude: null,
    longitude: null,
    geocodingAccuracy: null,
  };
}

/** Snapshot SAT/geo from LocationField — no catalog FK. */
export function locationValueToSatAddressFields(
  value: LocationValue,
): LocationSatAddressFields {
  return {
    locationName: value.locationName?.trim() || "",
    street: value.street ?? "",
    exteriorNumber: value.exteriorNumber ?? "",
    interiorNumber: value.interiorNumber ?? null,
    reference: value.reference ?? null,
    postalCode: value.postalCode ?? "",
    satCountryCode: value.satCountryCode?.trim() || "MEX",
    satStateCode: value.satStateCode ?? "",
    satMunicipalityCode: shortSatCode(value.satMunicipalityCode) ?? "",
    satLocalityCode: shortSatCode(value.satLocalityCode),
    localityName: value.localityName ?? null,
    satNeighborhoodCode: shortSatCode(value.satNeighborhoodCode),
    neighborhoodName: value.neighborhoodName ?? null,
    latitude: value.latitude ?? null,
    longitude: value.longitude ?? null,
    geocodingAccuracy: value.geocodingAccuracy ?? null,
  };
}

/** Build LocationField value from form fields (Card when there is a signal). */
export function locationValueFromSatAddressFields(
  fields: Partial<LocationSatAddressFields>,
): LocationValue | null {
  const locationName = fields.locationName?.trim() || null;
  const street = fields.street?.trim() || null;
  const postalCode = fields.postalCode?.trim() || null;
  const hasSignal =
    Boolean(locationName) ||
    Boolean(street) ||
    Boolean(postalCode) ||
    fields.latitude != null ||
    fields.longitude != null;
  if (!hasSignal) return null;

  return {
    locationName,
    street: fields.street ?? null,
    exteriorNumber: fields.exteriorNumber ?? null,
    interiorNumber: fields.interiorNumber ?? null,
    reference: fields.reference ?? null,
    postalCode: fields.postalCode ?? null,
    satCountryCode: fields.satCountryCode ?? "MEX",
    satStateCode: fields.satStateCode ?? null,
    satMunicipalityCode: fields.satMunicipalityCode ?? null,
    satLocalityCode: fields.satLocalityCode ?? null,
    localityName: fields.localityName ?? null,
    satNeighborhoodCode: fields.satNeighborhoodCode ?? null,
    neighborhoodName: fields.neighborhoodName ?? null,
    latitude: fields.latitude ?? null,
    longitude: fields.longitude ?? null,
    geocodingAccuracy: fields.geocodingAccuracy ?? null,
  };
}
