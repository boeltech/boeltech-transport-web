import {
  apiClient,
  mapSingleResponse,
  type ApiSingleResponse,
} from "@shared/api";
import type { LatLng } from "@shared/geolocation/contracts/geoPorts";

export type PostalCodeReferenceResolutionSource =
  | "sepomex"
  | "mapbox_postcode"
  | "mapbox_enriched"
  | "mapbox_places"
  | "sat_proximity";

export type PostalCodeReferenceConfidence = "high" | "low";

export interface PostalCodeReferenceResult {
  readonly postalCode: string;
  readonly position: LatLng;
  readonly label: string;
  readonly queryUsed: string;
  readonly resolutionSource: PostalCodeReferenceResolutionSource;
  readonly confidence: PostalCodeReferenceConfidence;
  readonly satStateCode: string | null;
  readonly satStateName: string | null;
  readonly satMunicipalityCode: string | null;
  readonly satMunicipalityName: string | null;
}

interface PostalCodeReferenceApi {
  readonly postal_code: string;
  readonly position: { readonly latitude: number; readonly longitude: number };
  readonly label: string;
  readonly query_used: string;
  readonly resolution_source: PostalCodeReferenceResolutionSource;
  readonly confidence: PostalCodeReferenceConfidence;
  readonly sat_state_code: string | null;
  readonly sat_state_name: string | null;
  readonly sat_municipality_code: string | null;
  readonly sat_municipality_name: string | null;
}

export interface ResolvePostalCodeReferenceInput {
  readonly postalCode: string;
  readonly proximity?: LatLng;
  readonly satStateCode?: string | null;
  readonly satMunicipalityCode?: string | null;
}

function mapPostalCodeReference(data: PostalCodeReferenceApi): PostalCodeReferenceResult {
  return {
    postalCode: data.postal_code,
    position: {
      latitude: data.position.latitude,
      longitude: data.position.longitude,
    },
    label: data.label,
    queryUsed: data.query_used,
    resolutionSource: data.resolution_source,
    confidence: data.confidence,
    satStateCode: data.sat_state_code,
    satStateName: data.sat_state_name,
    satMunicipalityCode: data.sat_municipality_code,
    satMunicipalityName: data.sat_municipality_name,
  };
}

export async function fetchPostalCodeReference(
  input: ResolvePostalCodeReferenceInput,
): Promise<PostalCodeReferenceResult | null> {
  try {
    const raw = await apiClient.post<ApiSingleResponse<PostalCodeReferenceApi>>(
      "/geo/postal-code-reference",
      {
        postalCode: input.postalCode.trim(),
        proximity: input.proximity,
        satStateCode: input.satStateCode ?? undefined,
        satMunicipalityCode: input.satMunicipalityCode ?? undefined,
      },
    );
    const result = mapSingleResponse(raw);
    return mapPostalCodeReference(result.data);
  } catch {
    return null;
  }
}
