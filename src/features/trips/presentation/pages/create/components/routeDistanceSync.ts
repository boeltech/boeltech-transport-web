import type { TripStopFormValues } from "./validation";
import { hasManualSegmentDistances } from "./stopDistanceHelpers";

export type SegmentDistanceApplyDecision =
  | { action: "apply" }
  | { action: "discard_stale" }
  | { action: "requeue_geo_changed" }
  | { action: "discard_manual_changed" };

/** True when stop count or any stop lat/lon differs between snapshots. */
export function didRouteGeoChange(
  snapshotStops: TripStopFormValues[],
  latestStops: TripStopFormValues[],
): boolean {
  if (latestStops.length !== snapshotStops.length) return true;
  return latestStops.some(
    (stop, index) =>
      stop.latitude !== snapshotStops[index]?.latitude ||
      stop.longitude !== snapshotStops[index]?.longitude,
  );
}

/**
 * Decide whether batch distance results may be written into the form after an
 * async request. Callers must bump `activeGeneration` when starting a newer sync.
 *
 * Manual rule (simple/safe): if the latest route has manual segments and the
 * caller did not confirm overwrite, discard — pre-flight dialog already blocks
 * starting a sync when manuals exist at request start without confirmation.
 */
export function decideSegmentDistanceApply(input: {
  requestGeneration: number;
  activeGeneration: number;
  snapshotStops: TripStopFormValues[];
  latestStops: TripStopFormValues[];
  confirmedOverwrite: boolean;
}): SegmentDistanceApplyDecision {
  const {
    requestGeneration,
    activeGeneration,
    snapshotStops,
    latestStops,
    confirmedOverwrite,
  } = input;

  if (requestGeneration !== activeGeneration) {
    return { action: "discard_stale" };
  }

  if (didRouteGeoChange(snapshotStops, latestStops)) {
    return { action: "requeue_geo_changed" };
  }

  if (!confirmedOverwrite && hasManualSegmentDistances(latestStops)) {
    return { action: "discard_manual_changed" };
  }

  return { action: "apply" };
}
