/**
 * Mapbox → SAT address resolver (ADR-0092 D-C).
 * Never silent-auto-maps ambiguous neighborhoods.
 */

import { apiClient } from "@shared/api";
import type { LatLng } from "@shared/geolocation/contracts/geoPorts";

export type ResolverConfidence = "high" | "medium" | "low";

export type AmbiguityField =
  | "neighborhood"
  | "municipality"
  | "state"
  | "locality"
  | "postalCode";

export interface ResolveMapboxInput {
  label: string;
  postalCode?: string | null;
  /** Municipality / place text from Mapbox context. */
  place?: string | null;
  /** State / region text. */
  region?: string | null;
  district?: string | null;
  neighborhood?: string | null;
  /** When omitted, resolver does not invent coordinates. */
  position?: LatLng | null;
}

export interface ResolvedSatFields {
  postalCode?: string;
  satStateCode?: string | null;
  satMunicipalityCode?: string | null;
  satNeighborhoodCode?: string | null;
  neighborhoodName?: string | null;
  localityName?: string | null;
  satLocalityCode?: string | null;
  latitude?: number;
  longitude?: number;
}

export interface ResolveMapboxResult {
  resolved: ResolvedSatFields;
  confidence: ResolverConfidence;
  ambiguities: AmbiguityField[];
  mapboxLabel: string;
}

interface PostalLookupRowApi {
  code?: string;
  name?: string;
}

interface PostalLookupApi {
  postal_code?: string;
  state_code?: string | null;
  state_name?: string | null;
  municipality_code?: string | null;
  municipality_name?: string | null;
  localities?: PostalLookupRowApi[];
  neighborhoods?: PostalLookupRowApi[];
}

export function extractPostalCodeFromLabel(label: string): string | null {
  const match = label.match(/\b(\d{5})\b/);
  return match?.[1] ?? null;
}

export function normalizeForMatch(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fuzzy match: needle includes haystack or vice versa after normalize.
 */
export function fuzzyIncludes(
  haystack: string | null | undefined,
  needle: string | null | undefined,
): boolean {
  const h = normalizeForMatch(haystack);
  const n = normalizeForMatch(needle);
  if (!h || !n) return false;
  return h.includes(n) || n.includes(h);
}

function getHttpStatus(error: unknown): number | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
  ) {
    return (error as { status: number }).status;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object" &&
    (error as { response?: unknown }).response !== null &&
    "status" in (error as { response: { status?: unknown } }).response &&
    typeof (error as { response: { status: unknown } }).response.status ===
      "number"
  ) {
    return (error as { response: { status: number } }).response.status;
  }
  return undefined;
}

async function fetchPostalLookup(
  postalCode: string,
): Promise<PostalLookupApi | null> {
  try {
    const response = await apiClient.get<{ data: PostalLookupApi }>(
      `/catalogs/sat/by-postal-code/${postalCode}`,
    );
    return response.data;
  } catch (error) {
    if (getHttpStatus(error) === 404) return null;
    throw error;
  }
}

function pickNeighborhood(
  neighborhoods: PostalLookupRowApi[],
  hint: string | null | undefined,
  label: string,
): {
  match: { code: string; name: string } | null;
  ambiguous: boolean;
} {
  const rows = neighborhoods.filter(
    (row): row is Required<PostalLookupRowApi> =>
      Boolean(row.code && row.name),
  );
  if (rows.length === 0) {
    return { match: null, ambiguous: false };
  }
  if (rows.length === 1) {
    return { match: { code: rows[0]!.code, name: rows[0]!.name }, ambiguous: false };
  }

  const candidates = rows.filter(
    (row) => fuzzyIncludes(row.name, hint) || fuzzyIncludes(label, row.name),
  );

  if (candidates.length === 1) {
    return {
      match: { code: candidates[0]!.code, name: candidates[0]!.name },
      ambiguous: false,
    };
  }

  // Multiple neighborhoods without a clear single match → ambiguity
  return { match: null, ambiguous: true };
}

function pickLocality(
  localities: PostalLookupRowApi[],
  hint: string | null | undefined,
  label: string,
): {
  match: { code: string; name: string } | null;
  ambiguous: boolean;
} {
  const rows = localities.filter(
    (row): row is Required<PostalLookupRowApi> =>
      Boolean(row.code && row.name),
  );
  if (rows.length === 0) return { match: null, ambiguous: false };
  if (rows.length === 1) {
    return { match: { code: rows[0]!.code, name: rows[0]!.name }, ambiguous: false };
  }

  const candidates = rows.filter(
    (row) => fuzzyIncludes(row.name, hint) || fuzzyIncludes(label, row.name),
  );
  if (candidates.length === 1) {
    return {
      match: { code: candidates[0]!.code, name: candidates[0]!.name },
      ambiguous: false,
    };
  }
  if (candidates.length > 1 || rows.length > 1) {
    return { match: null, ambiguous: true };
  }
  return { match: null, ambiguous: false };
}

/**
 * Resolve Mapbox geocode feature text/coords into SAT catalog fields.
 */
export async function resolveMapboxToSat(
  input: ResolveMapboxInput,
): Promise<ResolveMapboxResult> {
  const mapboxLabel = input.label;
  const postalCode =
    (input.postalCode?.trim() && /^\d{5}$/.test(input.postalCode.trim())
      ? input.postalCode.trim()
      : null) ?? extractPostalCodeFromLabel(mapboxLabel);

  const resolved: ResolvedSatFields = {};
  if (
    input.position &&
    Number.isFinite(input.position.latitude) &&
    Number.isFinite(input.position.longitude)
  ) {
    resolved.latitude = input.position.latitude;
    resolved.longitude = input.position.longitude;
  }
  const ambiguities: AmbiguityField[] = [];

  if (!postalCode) {
    ambiguities.push("postalCode");
    return {
      resolved,
      confidence: "low",
      ambiguities,
      mapboxLabel,
    };
  }

  resolved.postalCode = postalCode;

  const lookup = await fetchPostalLookup(postalCode);
  if (!lookup) {
    ambiguities.push("postalCode");
    return {
      resolved,
      confidence: "low",
      ambiguities,
      mapboxLabel,
    };
  }

  resolved.satStateCode = lookup.state_code ?? null;
  resolved.satMunicipalityCode = lookup.municipality_code ?? null;

  const stateHint = input.region ?? input.district;
  if (
    lookup.state_name &&
    stateHint &&
    !fuzzyIncludes(lookup.state_name, stateHint) &&
    !fuzzyIncludes(mapboxLabel, lookup.state_name)
  ) {
    ambiguities.push("state");
  }

  const placeHint = input.place ?? input.district;
  if (
    lookup.municipality_name &&
    placeHint &&
    !fuzzyIncludes(lookup.municipality_name, placeHint) &&
    !fuzzyIncludes(mapboxLabel, lookup.municipality_name)
  ) {
    ambiguities.push("municipality");
  }

  const neighborhoodPick = pickNeighborhood(
    lookup.neighborhoods ?? [],
    input.neighborhood ?? input.district,
    mapboxLabel,
  );
  if (neighborhoodPick.ambiguous) {
    ambiguities.push("neighborhood");
  } else if (neighborhoodPick.match) {
    resolved.satNeighborhoodCode = neighborhoodPick.match.code;
    resolved.neighborhoodName = neighborhoodPick.match.name;
  }

  const localityPick = pickLocality(
    lookup.localities ?? [],
    placeHint,
    mapboxLabel,
  );
  if (localityPick.ambiguous) {
    ambiguities.push("locality");
  } else if (localityPick.match) {
    resolved.satLocalityCode = localityPick.match.code;
    resolved.localityName = localityPick.match.name;
  }

  let confidence: ResolverConfidence = "high";
  if (ambiguities.length > 0) {
    confidence = ambiguities.includes("neighborhood") || ambiguities.includes("locality")
      ? "medium"
      : "low";
    if (
      ambiguities.includes("state") ||
      ambiguities.includes("municipality") ||
      ambiguities.includes("postalCode")
    ) {
      confidence = "low";
    } else if (ambiguities.length > 0) {
      confidence = "medium";
    }
  } else if (!resolved.satStateCode) {
    confidence = "medium";
  }

  return {
    resolved,
    confidence,
    ambiguities,
    mapboxLabel,
  };
}
