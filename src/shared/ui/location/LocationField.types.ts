/**
 * Location field contracts (ADR-0092 / WS-LOCATION Phase 2).
 */

import type { AmbiguityField } from "@shared/geolocation/addressResolver";
import type { GeocodingCandidate } from "@shared/geolocation/contracts/geoPorts";
import type { DuplicateCandidate } from "@shared/location/detectPossibleDuplicates";
import type { GeocodingAccuracy } from "@shared/location/geocodingAccuracy";
import type {
  AddressSearchListItem,
  SearchableOwnerType,
} from "@shared/ui/address-picker/types";

export type { GeocodingAccuracy };
export type { AmbiguityField };

/** Completeness matrix context from SDD §6. */
export type LocationContext =
  | "fiscal"
  | "operational"
  | "tripStop"
  | "geoPoint";

/** Confirmed / draft location value bound to forms. */
export interface LocationValue {
  locationName: string | null;
  street?: string | null;
  exteriorNumber?: string | null;
  interiorNumber?: string | null;
  postalCode?: string | null;
  satCountryCode?: string | null;
  satStateCode?: string | null;
  satMunicipalityCode?: string | null;
  satLocalityCode?: string | null;
  localityName?: string | null;
  satNeighborhoodCode?: string | null;
  neighborhoodName?: string | null;
  reference?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  geocodingAccuracy?: GeocodingAccuracy | null;
  geolocationPending?: boolean;
  /**
   * SAT fields left ambiguous after Mapbox→SAT resolve (ADR-0092 D-C).
   * Sheet shows warning; never treat as silent auto-map.
   */
  satAmbiguities?: AmbiguityField[];
  /** Source catalog id when selected from internal search (snapshot-only). */
  sourceAddressId?: string | null;
  /** Catalog owner metadata (snapshot-only; no FK on trip stop). */
  sourceOwnerType?: "client" | "branch" | "tenant" | null;
  sourceOwnerId?: string | null;
  sourceOwnerLabel?: string | null;
  addressType?: string | null;
  remitenteRfc?: string | null;
  remitenteName?: string | null;
  destinatarioRfc?: string | null;
  destinatarioName?: string | null;
  isPrimary?: boolean;
  isActive?: boolean;
  isCartaPorteReady?: boolean;
}

export type LocationSearchResultSource = "internal" | "mapbox" | "create";

export interface LocationSearchResult {
  id: string;
  source: LocationSearchResultSource;
  label: string;
  description?: string;
  /** Present when source === "internal". */
  internal?: AddressSearchListItem;
  /** Present when source === "mapbox". */
  mapbox?: GeocodingCandidate;
}

export type LocationCardVariant =
  | "compact"
  | "default"
  | "detailed"
  | "operational";

export interface LocationFieldProps {
  value: LocationValue | null;
  onChange: (value: LocationValue | null) => void;
  context: LocationContext;
  /** Optional client id to prioritize internal hits (D3). */
  clientId?: string | null;
  /** Restrict internal search to these owner types. */
  ownerTypes?: SearchableOwnerType[];
  /** Client-side filter for internal hits (e.g. trip address purposes). */
  filterItem?: (item: AddressSearchListItem) => boolean;
  /**
   * When false, omit catalog hits in the picker (create-only screens).
   * Default true — trip route / select-reuse keeps D3 internals first.
   */
  includeInternal?: boolean;
  /**
   * Catalog siblings for non-blocking duplicate warnings in LocationSheet (D-F).
   */
  existingAddresses?: readonly DuplicateCandidate[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  /** Show Carta Porte readiness chip on status. */
  showCartaPorteStatus?: boolean;
  /** Open create sheet instead of only calling onChange for create sentinel. */
  onCreateRequest?: () => void;
}
