import {
  apiClient,
  mapSingleResponse,
  type ApiSingleResponse,
} from "@shared/api";
import type {
  GeocodingProvider,
  GeocodeOutcome,
  GeocodeQuery,
  GeocodeQueryMeta,
  GeocodeResult,
  GeocodingCandidate,
  GeoFailure,
} from "@shared/geolocation/contracts/geoPorts";

interface GeocodeCandidateApi {
  readonly label: string;
  readonly position: {
    readonly latitude: number;
    readonly longitude: number;
  };
  readonly relevance?: number | null;
  readonly rawPlaceId?: string;
  readonly featureTypes?: string[];
  readonly region?: string | null;
  readonly place?: string | null;
  readonly district?: string | null;
  readonly neighborhood?: string | null;
  readonly postalCode?: string | null;
}

interface GeocodeQueryMetaApi {
  readonly detectedPostalCode?: string | null;
  readonly normalizedQuery?: string;
  readonly biasApplied?: GeocodeQueryMeta["biasApplied"];
  readonly searchConfidence?: GeocodeQueryMeta["searchConfidence"];
}

interface GeocodeResultApi {
  readonly provider: "mapbox";
  readonly candidates: GeocodeCandidateApi[];
  readonly requestedAt: string;
  readonly queryMeta?: GeocodeQueryMetaApi | null;
}

function mapGeocodingCandidate(
  candidate: GeocodeCandidateApi,
): GeocodingCandidate {
  return {
    label: candidate.label,
    position: {
      latitude: candidate.position.latitude,
      longitude: candidate.position.longitude,
    },
    relevance: candidate.relevance ?? null,
    rawPlaceId: candidate.rawPlaceId,
    featureTypes: candidate.featureTypes,
    region: candidate.region ?? null,
    place: candidate.place ?? null,
    district: candidate.district ?? null,
    neighborhood: candidate.neighborhood ?? null,
    postalCode: candidate.postalCode ?? null,
  };
}

function mapFailure(error: unknown): GeoFailure {
  const status = (
    error as {
      response?: {
        status?: number;
        data?: { error?: { code?: string; message?: string } };
      };
    }
  )?.response?.status;
  const apiError = (
    error as {
      response?: { data?: { error?: { code?: string; message?: string } } };
    }
  )?.response?.data?.error;

  if (apiError?.code && apiError?.message) {
    return {
      code: apiError.code as GeoFailure["code"],
      message: apiError.message,
      provider: "mapbox",
    };
  }

  if (status === 429) {
    return {
      code: "GEO_RATE_LIMITED",
      message: "Límite de consultas geográficas alcanzado. Intenta nuevamente.",
      provider: "mapbox",
    };
  }

  if (status === 404) {
    return {
      code: "GEO_ZERO_RESULTS",
      message: "No se encontraron resultados para la dirección indicada.",
      provider: "mapbox",
    };
  }

  return {
    code: "GEO_PROVIDER_UNAVAILABLE",
    message: "No fue posible consultar el proveedor geográfico.",
    provider: "mapbox",
  };
}

export class MapboxGeocodingAdapter implements GeocodingProvider {
  async forwardGeocode(query: GeocodeQuery): Promise<GeocodeOutcome> {
    try {
      const raw = await apiClient.post<ApiSingleResponse<GeocodeResultApi>>(
        "/geo/geocode",
        query,
      );
      const result = mapSingleResponse(raw);
      const meta = result.data.queryMeta;
      const queryMeta: GeocodeQueryMeta | undefined =
        meta && typeof meta === "object"
          ? {
              detectedPostalCode: meta.detectedPostalCode ?? null,
              normalizedQuery: meta.normalizedQuery ?? query.query,
              biasApplied: meta.biasApplied ?? "none",
              searchConfidence: meta.searchConfidence ?? "medium",
            }
          : undefined;
      const mapped: GeocodeResult = {
        provider: "mapbox",
        candidates: (result.data.candidates ?? []).map(mapGeocodingCandidate),
        requestedAt: result.data.requestedAt,
        ...(queryMeta ? { queryMeta } : {}),
      };
      return { ok: true, data: mapped };
    } catch (error) {
      return { ok: false, error: mapFailure(error) };
    }
  }
}
