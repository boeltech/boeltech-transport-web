/**
 * Pure D3 compositor: internal → context-prioritized → mapbox → create.
 */

import type { GeocodeSearchConfidence } from "@shared/geolocation/contracts/geoPorts";
import type { GeocodingCandidate } from "@shared/geolocation/contracts/geoPorts";
import type { AddressSearchListItem } from "@shared/ui/address-picker/types";

import { LOCATION_FIELD_COPY } from "./locationFieldCopy";
import type { LocationSearchResult } from "./LocationField.types";

export const LOCATION_CREATE_SENTINEL_ID = "__location_create__";

export interface ComposeLocationSearchParams {
  internal: readonly AddressSearchListItem[];
  mapbox: readonly GeocodingCandidate[];
  /** Optional owner (client) to float matching internals first. */
  clientId?: string | null;
  /** When false, omit create sentinel. Default true. */
  includeCreate?: boolean;
  /**
   * When false, omit catalog (internal) hits — create-only contexts
   * (settings/locations, branch/client address forms). Default true (D3 select/reuse).
   */
  includeInternal?: boolean;
  /**
   * When `low`, create is placed before Mapbox hits (ADR-0092 SQ-D6).
   * Internals stay first (D3) when `includeInternal` is true.
   */
  searchConfidence?: GeocodeSearchConfidence | null;
}

function formatInternalLabel(item: AddressSearchListItem): string {
  const name = item.locationName?.trim();
  if (name) return name;
  const street = [item.street, item.exteriorNumber].filter(Boolean).join(" ");
  if (street && item.postalCode) return `${street}, CP ${item.postalCode}`;
  return street || item.postalCode || item.id;
}

function formatInternalDescription(item: AddressSearchListItem): string {
  const parts = [
    item.ownerLabel?.trim() || undefined,
    item.neighborhoodName?.trim() || undefined,
    item.postalCode ? `CP ${item.postalCode}` : undefined,
  ].filter(Boolean);
  return parts.join(" · ");
}

function buildCreateResult(
  searchConfidence: GeocodeSearchConfidence | null | undefined,
): LocationSearchResult {
  const low = searchConfidence === "low";
  return {
    id: LOCATION_CREATE_SENTINEL_ID,
    source: "create",
    label: low
      ? LOCATION_FIELD_COPY.createNewLowConfidence
      : LOCATION_FIELD_COPY.createNew,
    description: low
      ? LOCATION_FIELD_COPY.lowConfidenceCreateHint
      : LOCATION_FIELD_COPY.emptyHint,
  };
}

/**
 * Merge search sources in D3 order:
 * 1. Internal matching `clientId` (context-prioritized)
 * 2. Remaining internal
 * 3. Create (elevated before Mapbox when searchConfidence=low)
 * 4. Mapbox candidates
 * 5. Create at end when confidence is not low
 */
export function composeLocationSearchResults(
  params: ComposeLocationSearchParams,
): LocationSearchResult[] {
  const {
    internal,
    mapbox,
    clientId,
    includeCreate = true,
    includeInternal = true,
    searchConfidence = null,
  } = params;
  const clientKey = clientId?.trim() || null;
  const elevateCreate = includeCreate && searchConfidence === "low";

  const prioritized: AddressSearchListItem[] = [];
  const rest: AddressSearchListItem[] = [];

  if (includeInternal) {
    for (const item of internal) {
      if (
        clientKey &&
        item.ownerType === "client" &&
        item.ownerId === clientKey
      ) {
        prioritized.push(item);
      } else {
        rest.push(item);
      }
    }
  }

  const results: LocationSearchResult[] = [];

  for (const item of [...prioritized, ...rest]) {
    results.push({
      id: `internal:${item.id}`,
      source: "internal",
      label: formatInternalLabel(item),
      description: formatInternalDescription(item) || undefined,
      internal: item,
    });
  }

  if (elevateCreate) {
    results.push(buildCreateResult(searchConfidence));
  }

  for (const candidate of mapbox) {
    const id =
      candidate.rawPlaceId != null && candidate.rawPlaceId !== ""
        ? `mapbox:${candidate.rawPlaceId}`
        : `mapbox:${candidate.label}:${candidate.position.latitude},${candidate.position.longitude}`;
    results.push({
      id,
      source: "mapbox",
      label: candidate.label,
      description: LOCATION_FIELD_COPY.sourceMapbox,
      mapbox: candidate,
    });
  }

  if (includeCreate && !elevateCreate) {
    results.push(buildCreateResult(searchConfidence));
  }

  return results;
}

export function locationValueFromInternal(
  item: AddressSearchListItem,
): import("./LocationField.types").LocationValue {
  return {
    locationName: item.locationName,
    street: item.street,
    exteriorNumber: item.exteriorNumber,
    postalCode: item.postalCode,
    satStateCode: item.satStateCode,
    satMunicipalityCode: item.satMunicipalityCode,
    satNeighborhoodCode: item.satNeighborhoodCode,
    neighborhoodName: item.neighborhoodName,
    latitude: item.latitude,
    longitude: item.longitude,
    geocodingAccuracy: item.geocodingAccuracy,
    geolocationPending: item.geolocationPending,
    sourceAddressId: item.id,
    sourceOwnerType: item.ownerType,
    sourceOwnerId: item.ownerId,
    sourceOwnerLabel: item.ownerLabel,
    addressType: item.addressType,
    remitenteRfc: item.remitenteRfc,
    remitenteName: item.remitenteName,
    destinatarioRfc: item.destinatarioRfc,
    destinatarioName: item.destinatarioName,
    isPrimary: item.isPrimary,
    isActive: item.isActive,
    isCartaPorteReady: item.isCartaPorteReady,
    satCountryCode: "MEX",
  };
}

/**
 * Rebuild a catalog search item from a LocationValue that came from internal search.
 * Returns null when source catalog ids are missing (mapbox / create drafts).
 */
export function locationValueToAddressSearchListItem(
  value: import("./LocationField.types").LocationValue,
): AddressSearchListItem | null {
  const ownerType = value.sourceOwnerType;
  const ownerId = value.sourceOwnerId?.trim();
  const addressId = value.sourceAddressId?.trim();
  if (!addressId || !ownerType || !ownerId) return null;

  const addressType =
    (value.addressType as AddressSearchListItem["addressType"] | null | undefined) ??
    "other";

  return {
    id: addressId,
    ownerType,
    ownerId,
    ownerLabel: value.sourceOwnerLabel ?? null,
    addressType,
    locationName: value.locationName,
    street: value.street ?? "",
    exteriorNumber: value.exteriorNumber ?? "",
    postalCode: value.postalCode ?? "",
    satStateCode: value.satStateCode ?? "",
    satMunicipalityCode: value.satMunicipalityCode ?? null,
    neighborhoodName: value.neighborhoodName ?? null,
    satNeighborhoodCode: value.satNeighborhoodCode ?? null,
    latitude: value.latitude ?? null,
    longitude: value.longitude ?? null,
    geocodingAccuracy: value.geocodingAccuracy ?? null,
    geolocationPending: value.geolocationPending ?? false,
    isPrimary: value.isPrimary ?? false,
    isActive: value.isActive ?? true,
    isCartaPorteReady: value.isCartaPorteReady ?? false,
    ...(value.remitenteRfc != null ? { remitenteRfc: value.remitenteRfc } : {}),
    ...(value.remitenteName != null ? { remitenteName: value.remitenteName } : {}),
    ...(value.destinatarioRfc != null
      ? { destinatarioRfc: value.destinatarioRfc }
      : {}),
    ...(value.destinatarioName != null
      ? { destinatarioName: value.destinatarioName }
      : {}),
  };
}

/**
 * Synthesize a search item for mapbox/create drafts so trip surfaces can keep
 * AddressSearchListItem-shaped handlers (snapshot-only; no catalog FK).
 * Preserves `satAmbiguities` for composer put-ready gating (ADR-0092).
 */
export function synthesizeSearchItemFromLocationValue(
  value: import("./LocationField.types").LocationValue,
): AddressSearchListItem & {
  satAmbiguities?: import("./LocationField.types").AmbiguityField[];
} {
  const addressType =
    (value.addressType as AddressSearchListItem["addressType"] | null | undefined) ??
    "other";

  return {
    id: value.sourceAddressId?.trim() || crypto.randomUUID(),
    ownerType: value.sourceOwnerType ?? "tenant",
    ownerId: value.sourceOwnerId?.trim() || "",
    ownerLabel: value.sourceOwnerLabel ?? null,
    addressType,
    locationName: value.locationName,
    street: value.street ?? "",
    exteriorNumber: value.exteriorNumber ?? "",
    postalCode: value.postalCode ?? "",
    satStateCode: value.satStateCode ?? "",
    satMunicipalityCode: value.satMunicipalityCode ?? null,
    neighborhoodName: value.neighborhoodName ?? null,
    satNeighborhoodCode: value.satNeighborhoodCode ?? null,
    latitude: value.latitude ?? null,
    longitude: value.longitude ?? null,
    geocodingAccuracy: value.geocodingAccuracy ?? null,
    geolocationPending: value.geolocationPending ?? false,
    isPrimary: value.isPrimary ?? false,
    isActive: value.isActive ?? true,
    isCartaPorteReady: value.isCartaPorteReady ?? false,
    ...(value.remitenteRfc != null ? { remitenteRfc: value.remitenteRfc } : {}),
    ...(value.remitenteName != null ? { remitenteName: value.remitenteName } : {}),
    ...(value.destinatarioRfc != null
      ? { destinatarioRfc: value.destinatarioRfc }
      : {}),
    ...(value.destinatarioName != null
      ? { destinatarioName: value.destinatarioName }
      : {}),
    ...(value.satAmbiguities?.length
      ? { satAmbiguities: [...value.satAmbiguities] }
      : {}),
  };
}

export function locationValueFromMapbox(
  candidate: GeocodingCandidate,
  extras?: Partial<import("./LocationField.types").LocationValue>,
): import("./LocationField.types").LocationValue {
  return {
    locationName: candidate.label,
    latitude: candidate.position.latitude,
    longitude: candidate.position.longitude,
    geocodingAccuracy: "approximate",
    geolocationPending: false,
    ...extras,
  };
}

export function formatLocationAddressSummary(
  value: import("./LocationField.types").LocationValue,
): string {
  const street = [value.street, value.exteriorNumber]
    .filter(Boolean)
    .join(" ")
    .trim();
  const parts = [
    street || undefined,
    value.neighborhoodName?.trim() || undefined,
    value.postalCode ? `CP ${value.postalCode}` : undefined,
  ].filter(Boolean);
  return parts.join(" · ") || LOCATION_FIELD_COPY.noCoordinates;
}
