import { config } from "@shared/config";
import { estimateRoadDistanceKm } from "@shared/utils/geoUtils";
import type {
  GeocodingProvider,
  DistanceMatrixProvider,
  GeoProviderId,
  MatrixSegmentInput,
  MatrixOutcome,
  SegmentsMatrixOutcome,
} from "@shared/geolocation/contracts/geoPorts";
import { MapboxGeocodingAdapter } from "@shared/geolocation/infrastructure/mapbox/MapboxGeocodingAdapter";
import { MapboxDistanceMatrixAdapter } from "@shared/geolocation/infrastructure/mapbox/MapboxDistanceMatrixAdapter";

export interface GeoProviderBundle {
  readonly providerId: GeoProviderId;
  readonly geocodingProvider: GeocodingProvider;
  readonly distanceMatrixProvider: DistanceMatrixProvider;
}

function resolveProviderId(): GeoProviderId {
  const raw = (config.geolocation.provider || "mapbox").trim().toLowerCase();
  if (raw === "stub") return "stub";
  return "mapbox";
}

class StubGeocodingProvider implements GeocodingProvider {
  async forwardGeocode() {
    return {
      ok: false as const,
      error: {
        code: "GEO_PROVIDER_UNAVAILABLE" as const,
        message: "Proveedor geográfico de pruebas sin implementación.",
        provider: "stub" as const,
      },
    };
  }
}

class StubDistanceMatrixProvider implements DistanceMatrixProvider {
  async segmentDistance(): Promise<MatrixOutcome> {
    return {
      ok: false as const,
      error: {
        code: "GEO_PROVIDER_UNAVAILABLE" as const,
        message: "Proveedor geográfico de pruebas sin implementación.",
        provider: "stub" as const,
      },
    };
  }

  async segmentsDistance(segments: MatrixSegmentInput[]): Promise<SegmentsMatrixOutcome> {
    const data = segments.map((seg) => {
      const km = estimateRoadDistanceKm(
        seg.origin.latitude,
        seg.origin.longitude,
        seg.destination.latitude,
        seg.destination.longitude,
      );
      return {
        distanceKm: km ?? 0,
        durationSeconds: null as number | null,
        provider: "stub" as const,
        source: "haversine_fallback" as const,
        confidence: "low" as const,
        computedAt: new Date().toISOString(),
      };
    });
    return { ok: true, data };
  }
}

export function createGeoProviderBundle(): GeoProviderBundle {
  const providerId = resolveProviderId();
  if (providerId === "stub") {
    return {
      providerId,
      geocodingProvider: new StubGeocodingProvider(),
      distanceMatrixProvider: new StubDistanceMatrixProvider(),
    };
  }

  return {
    providerId: "mapbox",
    geocodingProvider: new MapboxGeocodingAdapter(),
    distanceMatrixProvider: new MapboxDistanceMatrixAdapter(),
  };
}
