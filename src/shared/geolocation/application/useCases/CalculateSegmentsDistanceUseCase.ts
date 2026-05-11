import { estimateRoadDistanceKm } from "@shared/utils/geoUtils";
import type {
  DistanceMatrixProvider,
  MatrixSegmentInput,
  SegmentDistanceResult,
} from "@shared/geolocation/contracts/geoPorts";

/**
 * Calcula distancias para varios tramos vía API batch; si falla la petición,
 * aplica Haversine×1,30 por tramo (misma idea que `CalculateSegmentDistanceUseCase`).
 */
export class CalculateSegmentsDistanceUseCase {
  private readonly distanceMatrixProvider: DistanceMatrixProvider;

  constructor(distanceMatrixProvider: DistanceMatrixProvider) {
    this.distanceMatrixProvider = distanceMatrixProvider;
  }

  async execute(
    segments: MatrixSegmentInput[],
  ): Promise<SegmentDistanceResult[]> {
    if (segments.length === 0) return [];

    const batch = await this.distanceMatrixProvider.segmentsDistance(segments);
    if (batch.ok) return batch.data;

    return segments.map((seg) => {
      const km = estimateRoadDistanceKm(
        seg.origin.latitude,
        seg.origin.longitude,
        seg.destination.latitude,
        seg.destination.longitude,
      );
      return {
        distanceKm: km ?? 0,
        durationSeconds: null,
        provider: "mapbox" as const,
        source: "haversine_fallback" as const,
        confidence: "low" as const,
        computedAt: new Date().toISOString(),
      };
    });
  }
}
