/**
 * Domain types for aggregated address search (ADR-0053 / WS-ADDR-PRELOAD).
 */

export const SEARCHABLE_OWNER_TYPES = ["client", "tenant"] as const;

export type SearchableOwnerType = (typeof SEARCHABLE_OWNER_TYPES)[number];

export type AddressSearchAddressType =
  | "billing"
  | "shipping"
  | "pickup"
  | "warehouse"
  | "office"
  | "personal"
  | "trip_origin"
  | "trip_destination"
  | "trip_stop"
  | "company"
  | "branch"
  | "other";

export interface AddressSearchListItem {
  id: string;
  ownerType: SearchableOwnerType;
  ownerId: string;
  ownerLabel: string | null;
  addressType: AddressSearchAddressType;
  locationName: string | null;
  street: string;
  exteriorNumber: string;
  postalCode: string;
  satStateCode: string;
  satMunicipalityCode: string | null;
  neighborhoodName: string | null;
  satNeighborhoodCode: string | null;
  latitude: number | null;
  longitude: number | null;
  geolocationPending: boolean;
  isPrimary: boolean;
  isActive: boolean;
  isCartaPorteReady: boolean;
  /** Carta Porte remitente/destinatario from source (ADR-0053 / ADR-0055 fiscal snapshot). */
  remitenteRfc?: string | null;
  remitenteName?: string | null;
  destinatarioRfc?: string | null;
  destinatarioName?: string | null;
}

export interface AddressSearchParams {
  q?: string;
  ownerTypes?: SearchableOwnerType[];
  addressType?: AddressSearchAddressType;
  onlyGeolocated?: boolean;
  limit?: number;
  cursor?: string;
}

export interface AddressSearchPage {
  data: AddressSearchListItem[];
  pagination: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export const addressSearchQueryKeys = {
  all: ["address-search"] as const,
  search: (params: AddressSearchParams) =>
    [...addressSearchQueryKeys.all, params] as const,
};

/** Campos copiables al destino (snapshot sin FK a la fuente). */
export interface AddressSnapshotFields {
  locationName: string;
  satCountryCode: string;
  satStateCode: string;
  satMunicipalityCode: string | null;
  postalCode: string;
  satLocalityCode: string | null;
  localityName: string | null;
  satNeighborhoodCode: string | null;
  neighborhoodName: string | null;
  street: string;
  exteriorNumber: string;
  interiorNumber: string | null;
  reference: string | null;
  latitude: number | null;
  longitude: number | null;
  geolocationPending: boolean;
  addressType: AddressSearchAddressType;
}
