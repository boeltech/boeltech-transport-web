import type { LatLng } from "@shared/geolocation/contracts/geoPorts";

import type { TripStop } from "@features/trips/domain";
import type { ComposerEndpointPick } from "./buildReplaceStopsPayload";

function coordsOf(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): LatLng | null {
  if (
    latitude == null ||
    longitude == null ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }
  return { latitude, longitude };
}

function midpoint(a: LatLng, b: LatLng): LatLng {
  return {
    latitude: (a.latitude + b.latitude) / 2,
    longitude: (a.longitude + b.longitude) / 2,
  };
}

/**
 * Q16 — sesgo de búsqueda: extremo opuesto, o punto medio si hay ambos.
 * Bias suave (proximity), no filtro duro.
 */
export function resolveRouteSearchProximity(input: {
  category: "origin" | "destination" | "waypoint";
  originStop?: TripStop | null;
  destinationStop?: TripStop | null;
  originPick?: ComposerEndpointPick | null;
  destinationPick?: ComposerEndpointPick | null;
}): LatLng | null {
  const origin =
    coordsOf(input.originStop?.latitude, input.originStop?.longitude) ??
    coordsOf(input.originPick?.latitude, input.originPick?.longitude);
  const destination =
    coordsOf(
      input.destinationStop?.latitude,
      input.destinationStop?.longitude,
    ) ??
    coordsOf(input.destinationPick?.latitude, input.destinationPick?.longitude);

  if (input.category === "waypoint") {
    if (origin && destination) return midpoint(origin, destination);
    return origin ?? destination;
  }
  if (input.category === "origin") return destination;
  return origin;
}
