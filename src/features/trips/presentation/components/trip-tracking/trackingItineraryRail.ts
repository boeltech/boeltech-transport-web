/**
 * Riel de paradas (F2): plan vs real + fase derivada «En espera».
 * No inventa status de BD — usa tiempos del stop y visitState operativo.
 */
import { StopStatus, type TripStop } from "@features/trips/domain";
import { formatTime } from "@shared/utils/dateUtils";

import { trackingCopy } from "../../copy";
import {
  getRouteStopCategory,
  getStopOperationalVisitState,
  getStopTimeFieldsVisibility,
  type RouteStopCategory,
  type TripScheduleTimes,
} from "../trip-route/tripRouteDetailHelpers";

export type StopPlanRealKind = "arrival" | "departure";

export type StopPlanRealLine = {
  kind: StopPlanRealKind;
  /** Línea compacta lista para UI (p. ej. «Llegada plan 10:00 · real 10:25»). */
  summary: string;
  planValue: string;
  realValue: string;
};

function formatRailTime(value: Date | null | undefined): string {
  if (value == null) return "—";
  return formatTime(value.toISOString());
}

/**
 * T6: «En espera» es presentación (andén / at_stop), no status BD.
 * Criterio: visita operativa en sitio, o llegada real sin salida.
 */
export function isStopWaitingPhase(
  stop: TripStop,
  category?: RouteStopCategory,
  tripTimes?: TripScheduleTimes,
): boolean {
  if (
    stop.status === StopStatus.SKIPPED ||
    stop.status === StopStatus.COMPLETED
  ) {
    return false;
  }

  const resolvedCategory = category ?? getRouteStopCategory(stop);
  if (
    getStopOperationalVisitState(stop, resolvedCategory, tripTimes) ===
    "at_stop"
  ) {
    return true;
  }

  return stop.actualArrival != null && stop.actualDeparture == null;
}

function resolvePlanDeparture(
  stop: TripStop,
  category: RouteStopCategory,
  tripTimes?: TripScheduleTimes,
): Date | null {
  if (category === "origin") {
    return (
      stop.estimatedDeparture ?? tripTimes?.scheduledDeparture ?? null
    );
  }
  return stop.estimatedDeparture ?? null;
}

function resolveRealDeparture(
  stop: TripStop,
  category: RouteStopCategory,
  tripTimes?: TripScheduleTimes,
): Date | null {
  if (category === "origin") {
    return stop.actualDeparture ?? tripTimes?.actualDeparture ?? null;
  }
  return stop.actualDeparture ?? null;
}

/**
 * Filas plan vs real según rol de la parada (origen = salida; destino = llegada).
 */
export function buildStopPlanRealLines(
  stop: TripStop,
  category?: RouteStopCategory,
  tripTimes?: TripScheduleTimes,
): StopPlanRealLine[] {
  const resolvedCategory = category ?? getRouteStopCategory(stop);
  const visibility = getStopTimeFieldsVisibility(resolvedCategory);
  const lines: StopPlanRealLine[] = [];

  if (visibility.showArrival) {
    const planValue = formatRailTime(stop.estimatedArrival);
    const realValue = formatRailTime(stop.actualArrival);
    lines.push({
      kind: "arrival",
      planValue,
      realValue,
      summary: trackingCopy.label.planVsRealArrival(planValue, realValue),
    });
  }

  if (visibility.showDeparture) {
    const planValue = formatRailTime(
      resolvePlanDeparture(stop, resolvedCategory, tripTimes),
    );
    const realValue = formatRailTime(
      resolveRealDeparture(stop, resolvedCategory, tripTimes),
    );
    lines.push({
      kind: "departure",
      planValue,
      realValue,
      summary: trackingCopy.label.planVsRealDeparture(planValue, realValue),
    });
  }

  return lines;
}
