/**
 * Título del detalle (F9h / D-F9h-14): corredor solo origen → destino.
 * Escalas no entran al H1. Identidad Lugar: locationName → city → address.
 */

import { StopType, type TripStop } from "@features/trips/domain";

import { formatTripEndpointLabel } from "../uiHelpers";
import { resolveRouteStopPlaceLabel } from "./routeStopPlaceLabel";

export type TripRouteTitleLegacy = {
  originCity?: string | null;
  originState?: string | null;
  destinationCity?: string | null;
  destinationState?: string | null;
};

/**
 * Construye «Origen → Destino» (o «—»). Las escalas no participan.
 */
export function formatTripRouteTitle(
  stops: readonly TripStop[] | undefined,
  legacy: TripRouteTitleLegacy,
): string {
  const ordered = stops?.length
    ? [...stops].sort((a, b) => a.sequenceOrder - b.sequenceOrder)
    : [];

  const originStop = ordered.find((stop) => {
    const types = Array.isArray(stop.stopType) ? stop.stopType : [stop.stopType];
    return types.includes(StopType.ORIGIN);
  });
  const destinationStop = ordered.find((stop) => {
    const types = Array.isArray(stop.stopType) ? stop.stopType : [stop.stopType];
    return types.includes(StopType.DESTINATION);
  });

  const origin =
    (originStop ? resolveRouteStopPlaceLabel(originStop) : null) ??
    formatTripEndpointLabel(undefined, {
      city: legacy.originCity,
      state: legacy.originState,
    });
  const destination =
    (destinationStop ? resolveRouteStopPlaceLabel(destinationStop) : null) ??
    formatTripEndpointLabel(undefined, {
      city: legacy.destinationCity,
      state: legacy.destinationState,
    });

  if (!origin && !destination) return "—";
  return `${origin || "Origen"} → ${destination || "Destino"}`;
}
