/**
 * Fused internal + Mapbox location search (ADR-0092 D-B + search-quality P1).
 * Debounce is the caller's responsibility (or pass already-debounced `q`).
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { createGeoProviderBundle } from "@shared/geolocation/infrastructure/GeoProviderFactory";
import type {
  GeocodeSearchConfidence,
  GeocodingCandidate,
  LatLng,
} from "@shared/geolocation/contracts/geoPorts";
import {
  isAddressSearchFilterActive,
  useAddressSearch,
} from "@shared/ui/address-picker/useAddressSearch";
import type {
  AddressSearchAddressType,
  SearchableOwnerType,
} from "@shared/ui/address-picker/types";

import { composeLocationSearchResults } from "./locationSearchCompositor";
import type { LocationSearchResult } from "./LocationField.types";

const MAPBOX_MIN_QUERY_LENGTH = 3;

/** Heuristic: Google-style paste or CP → ask API for more candidates. */
export function isLikelyPastedAddress(q: string): boolean {
  const trimmed = q.trim();
  if (/\b\d{5}\b/.test(trimmed)) return true;
  if ((trimmed.match(/,/g) ?? []).length >= 2) return true;
  return trimmed.length >= 60;
}

export interface UseLocationSearchParams {
  /** Search text (preferably debounced by caller). */
  q: string;
  enabled?: boolean;
  clientId?: string | null;
  ownerTypes?: SearchableOwnerType[];
  addressType?: AddressSearchAddressType;
  onlyGeolocated?: boolean;
  limit?: number;
  includeCreate?: boolean;
  /**
   * When false, skip catalog search and omit internal hits.
   * Default true (trip select/reuse).
   */
  includeInternal?: boolean;
  /** Skip Mapbox (e.g. offline / tests). */
  disableMapbox?: boolean;
  /**
   * Optional proximity bias (branch / fiscal / existing pin).
   * CP bias still runs on API via bias_from_query.
   */
  proximity?: LatLng | null;
}

export interface UseLocationSearchResult {
  results: LocationSearchResult[];
  isLoading: boolean;
  isFetching: boolean;
  internalError: Error | null;
  mapboxError: Error | null;
  /** Search-quality confidence from API query_meta (not SAT resolver). */
  searchConfidence: GeocodeSearchConfidence | null;
}

interface MapboxSearchPayload {
  candidates: GeocodingCandidate[];
  searchConfidence: GeocodeSearchConfidence | null;
}

export function useLocationSearch({
  q,
  enabled = true,
  clientId,
  ownerTypes,
  addressType,
  onlyGeolocated,
  limit = 20,
  includeCreate = true,
  includeInternal = true,
  disableMapbox = false,
  proximity = null,
}: UseLocationSearchParams): UseLocationSearchResult {
  const trimmed = q.trim();
  const mapboxEnabled =
    enabled &&
    !disableMapbox &&
    trimmed.length >= MAPBOX_MIN_QUERY_LENGTH;
  const internalEnabled = enabled && includeInternal;

  const pasteLike = isLikelyPastedAddress(trimmed);
  const mapboxLimit = Math.min(limit, pasteLike ? 10 : 5);
  const proximityKey =
    proximity != null
      ? `${proximity.latitude.toFixed(5)},${proximity.longitude.toFixed(5)}`
      : null;

  const internalQuery = useAddressSearch({
    params: {
      q: trimmed,
      ownerTypes,
      addressType,
      onlyGeolocated,
      limit,
    },
    enabled: internalEnabled,
  });

  const mapboxQuery = useQuery({
    queryKey: [
      "location-mapbox-geocode",
      trimmed,
      mapboxLimit,
      proximityKey,
    ],
    queryFn: async (): Promise<MapboxSearchPayload> => {
      const bundle = createGeoProviderBundle();
      const outcome = await bundle.geocodingProvider.forwardGeocode({
        query: trimmed,
        limit: mapboxLimit,
        countryCode: "MX",
        biasFromQuery: true,
        ...(proximity
          ? {
              proximity: {
                latitude: proximity.latitude,
                longitude: proximity.longitude,
              },
            }
          : {}),
        ...(pasteLike ? { types: ["address"] } : {}),
      });
      if (!outcome.ok) {
        throw new Error(outcome.error.message);
      }
      return {
        candidates: outcome.data.candidates,
        searchConfidence: outcome.data.queryMeta?.searchConfidence ?? null,
      };
    },
    enabled: mapboxEnabled,
    staleTime: 30_000,
    retry: false,
  });

  const searchConfidence = mapboxEnabled
    ? (mapboxQuery.data?.searchConfidence ?? null)
    : null;

  const results = useMemo(
    () =>
      composeLocationSearchResults({
        internal: includeInternal ? (internalQuery.data?.data ?? []) : [],
        mapbox: mapboxQuery.data?.candidates ?? [],
        clientId,
        includeCreate,
        includeInternal,
        searchConfidence,
      }),
    [
      includeInternal,
      internalQuery.data?.data,
      mapboxQuery.data?.candidates,
      clientId,
      includeCreate,
      searchConfidence,
    ],
  );

  return {
    results,
    isLoading:
      (internalEnabled && internalQuery.isLoading) ||
      (mapboxEnabled && mapboxQuery.isLoading),
    isFetching:
      (internalEnabled && internalQuery.isFetching) || mapboxQuery.isFetching,
    internalError: includeInternal ? (internalQuery.error ?? null) : null,
    mapboxError: mapboxQuery.error ?? null,
    searchConfidence,
  };
}

export { isAddressSearchFilterActive, MAPBOX_MIN_QUERY_LENGTH };
