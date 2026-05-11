import { describe, expect, it, vi } from "vitest";
import { CalculateSegmentsDistanceUseCase } from "./CalculateSegmentsDistanceUseCase";
import type { DistanceMatrixProvider } from "@shared/geolocation/contracts/geoPorts";

const segment = {
  origin: { latitude: 19.4326, longitude: -99.1332 },
  destination: { latitude: 20.9674, longitude: -89.5926 },
};

describe("CalculateSegmentsDistanceUseCase", () => {
  it("returns provider batch results when ok", async () => {
    const provider: DistanceMatrixProvider = {
      segmentDistance: vi.fn(),
      segmentsDistance: vi.fn().mockResolvedValue({
        ok: true,
        data: [
          {
            distanceKm: 99,
            durationSeconds: null,
            provider: "mapbox",
            source: "mapbox_matrix",
            confidence: "high",
            computedAt: "2026-05-09T00:00:00.000Z",
          },
        ],
      }),
    };
    const uc = new CalculateSegmentsDistanceUseCase(provider);
    const out = await uc.execute([segment]);
    expect(out).toHaveLength(1);
    expect(out[0]?.distanceKm).toBe(99);
    expect(out[0]?.source).toBe("mapbox_matrix");
  });

  it("falls back to haversine when batch request fails", async () => {
    const provider: DistanceMatrixProvider = {
      segmentDistance: vi.fn(),
      segmentsDistance: vi.fn().mockResolvedValue({
        ok: false,
        error: {
          code: "GEO_PROVIDER_UNAVAILABLE",
          message: "fail",
          provider: "mapbox",
        },
      }),
    };
    const uc = new CalculateSegmentsDistanceUseCase(provider);
    const out = await uc.execute([segment]);
    expect(out).toHaveLength(1);
    expect(out[0]?.source).toBe("haversine_fallback");
    expect(out[0]?.distanceKm).toBeGreaterThan(0);
  });
});
