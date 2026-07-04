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
  readonly postalCode: string;
  readonly position: { readonly latitude: number; readonly longitude: number };
  readonly label: string;
  readonly queryUsed: string;
  readonly resolutionSource: PostalCodeReferenceResolutionSource;
  readonly confidence: PostalCodeReferenceConfidence;
  readonly satStateCode: string | null;
  readonly satStateName: string | null;
  readonly satMunicipalityCode: string | null;
  readonly satMunicipalityName: string | null;
}

export interface ResolvePostalCodeReferenceInput {
  readonly postalCode: string;
  readonly proximity?: LatLng;
  readonly satStateCode?: string | null;
  readonly satMunicipalityCode?: string | null;
}

function mapPostalCodeReference(data: PostalCodeReferenceApi): PostalCodeReferenceResult {
  return {
    postalCode: data.postalCode,
    position: {
      latitude: data.position.latitude,
      longitude: data.position.longitude,
    },
    label: data.label,
    queryUsed: data.queryUsed,
    resolutionSource: data.resolutionSource,
    confidence: data.confidence,
    satStateCode: data.satStateCode,
    satStateName: data.satStateName,
    satMunicipalityCode: data.satMunicipalityCode,
    satMunicipalityName: data.satMunicipalityName,
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
