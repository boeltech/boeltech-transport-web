import { estimateRoadDistanceKm } from "@shared/utils/geoUtils";
import type {
  DistanceMatrixProvider,
  MatrixOutcome,
  MatrixSegmentInput,
  SegmentDistanceResult,
} from "@shared/geolocation/contracts/geoPorts";

export class CalculateSegmentDistanceUseCase {
  private readonly distanceMatrixProvider: DistanceMatrixProvider;

  constructor(distanceMatrixProvider: DistanceMatrixProvider) {
    this.distanceMatrixProvider = distanceMatrixProvider;
  }

  async execute(input: MatrixSegmentInput): Promise<MatrixOutcome> {
    const matrix = await this.distanceMatrixProvider.segmentDistance(input);
    if (matrix.ok) return matrix;

    const fallbackDistance = estimateRoadDistanceKm(
      input.origin.latitude,
      input.origin.longitude,
      input.destination.latitude,
      input.destination.longitude,
    );

    if (fallbackDistance == null) {
      return matrix;
    }

    const fallback: SegmentDistanceResult = {
      distanceKm: fallbackDistance,
      durationSeconds: null,
      provider: "mapbox",
      source: "haversine_fallback",
      confidence: "low",
      computedAt: new Date().toISOString(),
    };

    return { ok: true, data: fallback };
  }
}
