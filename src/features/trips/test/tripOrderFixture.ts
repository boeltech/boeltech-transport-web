import { TripStatus, type Trip, type TripOrderStatus } from "@features/trips/domain";

/** Vista GET /trips/:id/trip-order ya en camelCase. */
export function tripOrderStatusFixture(
  overrides: Partial<TripOrderStatus> = {},
): TripOrderStatus {
  const base: TripOrderStatus = {
    tripId: "trip-1",
    enabled: true,
    threshold: { met: true, missing: [] },
    eligibility: {
      canGenerate: true,
      canRegenerate: false,
      canDownload: false,
      reasonCode: null,
    },
    currentEmission: null,
    emissionCount: 0,
  };
  return {
    ...base,
    ...overrides,
    threshold: { ...base.threshold, ...overrides.threshold },
    eligibility: { ...base.eligibility, ...overrides.eligibility },
    currentEmission:
      overrides.currentEmission === undefined
        ? base.currentEmission
        : overrides.currentEmission,
  };
}

export function tripOrderEmissionFixture(
  overrides: Partial<NonNullable<TripOrderStatus["currentEmission"]>> = {},
): NonNullable<TripOrderStatus["currentEmission"]> {
  return {
    id: "em-1",
    version: 1,
    issuedAt: "2026-10-12T18:00:00.000Z",
    issuedByUserId: "user-1",
    issuedByName: "Ana Despacho",
    tripStatusAtIssue: TripStatus.SCHEDULED,
    outdated: false,
    filename: "orden-viaje-V-2026-0042-v1.pdf",
    ...overrides,
  };
}

export function tripOrderTripFixture(overrides: Partial<Trip> = {}): Trip {
  return {
    id: "trip-1",
    status: TripStatus.SCHEDULED,
    ...overrides,
  } as Trip;
}
