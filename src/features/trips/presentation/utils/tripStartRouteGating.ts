/**
 * Adapter web → regla de esqueleto de ruta al iniciar (@boeltech/cfdi-domain).
 */

import {
  canStartTripWithRoute,
  isTripRouteReadyForStart,
  type StopType,
  type TripStatus,
} from "@boeltech/cfdi-domain";
import type { TripStop, TripStatusType } from "@features/trips/domain";

export type TripStartRouteStopLike = Pick<TripStop, "stopType">;

function mapStops(
  stops: readonly TripStartRouteStopLike[],
): Array<{ stopType: StopType | readonly StopType[] }> {
  return stops.map((stop) => ({
    stopType: stop.stopType as StopType | readonly StopType[],
  }));
}

export function isTripRouteReadyForStartUi(
  stops: readonly TripStartRouteStopLike[],
): boolean {
  return isTripRouteReadyForStart(mapStops(stops));
}

export function canStartTripWithRouteUi(
  tripStatus: TripStatusType,
  stops: readonly TripStartRouteStopLike[],
) {
  return canStartTripWithRoute({
    tripStatus: tripStatus as TripStatus,
    stops: mapStops(stops),
  });
}

/** Motivo para deshabilitar Iniciar; null si la ruta no bloquea. */
export function tripStartRouteBlockReason(
  tripStatus: TripStatusType,
  stops: readonly TripStartRouteStopLike[],
): string | null {
  const result = canStartTripWithRouteUi(tripStatus, stops);
  if (result.ok) return null;
  const routeError = result.error.find(
    (error) => error.code === "TRIP_START_ROUTE_REQUIRED",
  );
  return routeError?.message ?? null;
}

/** D10: copy de dominio + escala a patio. No enseña asignar/Confirmar. */
export function withPatioStartEscalation(
  reason: string | null,
  escalate: boolean,
  suffix: string,
): string | null {
  if (!reason) return null;
  if (!escalate) return reason;
  return `${reason} ${suffix}`;
}
