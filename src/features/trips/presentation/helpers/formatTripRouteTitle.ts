/**
 * Título del detalle (RP-2 / F11 opción B): corredor ciudad-only origen → destino.
 * Escalas no entran al H1. No usa `resolveRouteStopPlaceLabel` (F9h locationName
 * sigue en timeline / Distancias / markers).
 */

import { StopType, type TripStop } from "@features/trips/domain";

import { formatTripEndpointLabel } from "../uiHelpers";

export type TripRouteTitleLegacy = {
  originCity?: string | null;
  originState?: string | null;
  destinationCity?: string | null;
  destinationState?: string | null;
};

function cityOnlyFromStop(stop: TripStop | undefined): string | null {
  if (!stop) return null;
  const city = stop.city?.trim();
  if (city && !/^\d{1,3}$/.test(city)) return city;
  return null;
}

/**
 * Construye «Origen → Destino» ciudad-only (o «—»). Las escalas no participan.
 * Preferir `useTripListRouteCitiesOnly` en UI cuando hay catálogos SAT.
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
    cityOnlyFromStop(originStop) ??
    formatTripEndpointLabel(undefined, {
      city: legacy.originCity,
      state: undefined,
    });
  const destination =
    cityOnlyFromStop(destinationStop) ??
    formatTripEndpointLabel(undefined, {
      city: legacy.destinationCity,
      state: undefined,
    });

  if (!origin && !destination) return "—";
  return `${origin || "Origen"} → ${destination || "Destino"}`;
}
