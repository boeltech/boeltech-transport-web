import {
  apiClient,
  mapSingleResponse,
  type ApiSingleResponse,
} from "@shared/api";
import type {
  DistanceMatrixProvider,
  MatrixSegmentInput,
  MatrixOutcome,
  SegmentDistanceResult,
  SegmentsMatrixOutcome,
  GeoFailure,
  GeoProviderId,
  DistanceSource,
  DistanceConfidence,
} from "@shared/geolocation/contracts/geoPorts";

interface SegmentDistanceResultApi {
  readonly distanceKm: number;
  readonly durationSeconds?: number | null;
  readonly provider: GeoProviderId;
  readonly source: DistanceSource;
  readonly confidence: DistanceConfidence;
  readonly computedAt: string;
}

interface SegmentsBatchPayloadApi {
  readonly segments: SegmentDistanceResultApi[];
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
      message: "Límite de cálculo de distancias alcanzado. Intenta nuevamente.",
      provider: "mapbox",
    };
  }

  if (status === 404) {
    return {
      code: "GEO_ROUTE_NOT_FOUND",
      message: "No se encontró ruta vial entre los puntos seleccionados.",
      provider: "mapbox",
    };
  }

  return {
    code: "GEO_PROVIDER_UNAVAILABLE",
    message: "No fue posible calcular la distancia con el proveedor geográfico.",
    provider: "mapbox",
  };
}

function mapApiSegmentToResult(data: SegmentDistanceResultApi): SegmentDistanceResult {
  return {
    distanceKm: data.distanceKm,
    durationSeconds: data.durationSeconds ?? null,
    provider: data.provider,
    source: data.source,
    confidence: data.confidence,
    computedAt: data.computedAt,
  };
}

export class MapboxDistanceMatrixAdapter implements DistanceMatrixProvider {
  async segmentDistance(input: MatrixSegmentInput): Promise<MatrixOutcome> {
    try {
      const raw = await apiClient.post<ApiSingleResponse<SegmentDistanceResultApi>>(
        "/geo/distance-segment",
        input,
      );
      const result = mapSingleResponse(raw);
      return { ok: true, data: mapApiSegmentToResult(result.data) };
    } catch (error) {
      return { ok: false, error: mapFailure(error) };
    }
  }

  async segmentsDistance(
    segments: MatrixSegmentInput[],
  ): Promise<SegmentsMatrixOutcome> {
    if (segments.length === 0) {
      return { ok: true, data: [] };
    }
    try {
      const raw = await apiClient.post<ApiSingleResponse<SegmentsBatchPayloadApi>>(
        "/geo/distance-segments",
        { segments },
      );
      const result = mapSingleResponse(raw);
      return {
        ok: true,
        data: result.data.segments.map(mapApiSegmentToResult),
      };
    } catch (error) {
      return { ok: false, error: mapFailure(error) };
    }
  }
}
