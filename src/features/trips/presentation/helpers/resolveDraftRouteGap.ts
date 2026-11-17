import type { TripStop } from "@features/trips/domain";

import {
  getRouteStopCategory,
  isStopDomicilioComplete,
} from "../components/trip-route/tripRouteDetailHelpers";

/** Hueco de ruta en Reserva para Qué sigue (D57). */
export type DraftRouteGap =
  | "origin"
  | "destination"
  | "domicilio"
  | "route";

/**
 * Qué falta en la ruta del draft (D57 — Qué sigue nombra el pendiente).
 * `null` = ruta lista (ambos extremos con domicilio put-ready).
 */
export function resolveDraftRouteGap(
  stops: readonly TripStop[],
): DraftRouteGap | null {
  const origin = stops.find((stop) => getRouteStopCategory(stop) === "origin");
  const destination = stops.find(
    (stop) => getRouteStopCategory(stop) === "destination",
  );

  if (!origin && !destination) return "route";
  if (!origin) return "origin";
  if (!destination) return "destination";

  const incomplete = [origin, destination, ...stops].some(
    (stop) => !isStopDomicilioComplete(stop),
  );
  if (incomplete) return "domicilio";
  return null;
}
