import type { AddressSearchListItem, AddressSnapshotFields } from "./types";

function shortSatCode(code: string | null | undefined): string | null {
  if (code == null) return null;
  const normalized = code.trim();
  if (!normalized) return null;
  const parts = normalized.split("-").filter(Boolean);
  return (parts[parts.length - 1] ?? normalized).trim();
}

/**
 * Copia campos SAT/geo al destino sin id ni owner de la fuente (ADR-0053 snapshot).
 * Validación SAT al persistir: `@shared/cfdi/addressPayloadBridge` + paquete.
 */
export function toAddressSnapshot(
  source: AddressSearchListItem,
): AddressSnapshotFields {
  return {
    locationName: source.locationName?.trim() || "",
    satCountryCode: "MEX",
    satStateCode: source.satStateCode || "",
    satMunicipalityCode: shortSatCode(source.satMunicipalityCode),
    postalCode: source.postalCode || "",
    satLocalityCode: null,
    localityName: null,
    satNeighborhoodCode: shortSatCode(source.satNeighborhoodCode),
    neighborhoodName: source.neighborhoodName ?? null,
    street: source.street || "",
    exteriorNumber: source.exteriorNumber || "",
    interiorNumber: null,
    reference: null,
    latitude: source.latitude ?? null,
    longitude: source.longitude ?? null,
    geolocationPending: source.geolocationPending,
    addressType: source.addressType,
  };
}
