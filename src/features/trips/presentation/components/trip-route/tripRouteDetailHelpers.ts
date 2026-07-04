import {
  StopStatus,
  StopType,
  isUnifiedAddressId,
  type StopTypeValue,
  type TripStop,
  type TripStatusType,
} from "@features/trips/domain";
import { formatDateTime } from "@shared/utils/dateUtils";

import { progressCopy } from "../../copy/tripDetail/progressCopy";
import { routeCopy } from "../../copy/tripDetail/routeCopy";

const copy = routeCopy;
const stopBadgeCopy = progressCopy.label;

export type RouteStopCategory = "origin" | "waypoint" | "destination";

export function getRouteStopCategory(stop: TripStop): RouteStopCategory {
  const types = Array.isArray(stop.stopType) ? stop.stopType : [stop.stopType];
  if (types.includes(StopType.ORIGIN)) return "origin";
  if (types.includes(StopType.DESTINATION)) return "destination";
  return "waypoint";
}

export function groupStopsForRouteDetail(stops: readonly TripStop[]) {
  const ordered = [...stops].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  const origin = ordered.find((stop) => getRouteStopCategory(stop) === "origin");
  const destination = ordered.find(
    (stop) => getRouteStopCategory(stop) === "destination",
  );
  const waypoints = ordered.filter(
    (stop) => getRouteStopCategory(stop) === "waypoint",
  );
  return { ordered, origin, destination, waypoints };
}

export function sumRouteSegmentDistanceKm(stops: readonly TripStop[]): number | null {
  const segments = stops.filter(
    (stop) =>
      stop.sequenceOrder > 0 &&
      stop.distanceFromPreviousKm != null &&
      stop.distanceFromPreviousKm > 0,
  );
  if (segments.length === 0) return null;
  return segments.reduce(
    (sum, stop) => sum + (stop.distanceFromPreviousKm ?? 0),
    0,
  );
}

export function countStopsMissingSegmentDistance(stops: readonly TripStop[]): number {
  return stops.filter(
    (stop) =>
      stop.sequenceOrder > 0 &&
      (stop.distanceFromPreviousKm == null || stop.distanceFromPreviousKm <= 0),
  ).length;
}

export function stopRequiresFiscalRfc(stop: TripStop): boolean {
  const types = Array.isArray(stop.stopType) ? stop.stopType : [stop.stopType];
  return (
    types.includes(StopType.ORIGIN) ||
    types.includes(StopType.DESTINATION) ||
    types.includes(StopType.PICKUP) ||
    types.includes(StopType.DELIVERY)
  );
}

export function countStopsMissingFiscalRfc(stops: readonly TripStop[]): number {
  return stops.filter(
    (stop) =>
      stopRequiresFiscalRfc(stop) && !stop.rfcRemitenteDestinatario?.trim(),
  ).length;
}

export function formatDistanceSourceLabel(
  source: TripStop["distanceSource"],
): string | null {
  if (!source) return null;
  if (source === "manual") return copy.label.distanceManual;
  if (source === "mapbox_matrix") return copy.label.distanceMapbox;
  if (source === "haversine_fallback") return copy.label.distanceEstimated;
  return copy.label.distanceFallback;
}

export function routeStopCardBorderClass(category: RouteStopCategory): string {
  if (category === "origin") return "border-success/30 bg-success-soft/40";
  if (category === "destination") return "border-destructive/30 bg-destructive-soft/40";
  return "border-border bg-card";
}

export function shouldShowTrackingHint(
  tripStatus: TripStatusType,
  isVisited: boolean,
): boolean {
  return tripStatus === "in_progress" && !isVisited;
}

export function stopUsesSavedAddress(stop: TripStop): boolean {
  return isUnifiedAddressId(stop.addressId);
}

export function hasStopType(
  stopType: TripStop["stopType"],
  target: StopTypeValue,
): boolean {
  const types = Array.isArray(stopType) ? stopType : [stopType];
  return types.includes(target);
}

// ── Tiempos por tipo de parada (Carta Porte / Seguimiento) ─────────────────

export type StopTimeFieldKind = "arrival" | "departure";

export type StopTimeFieldsVisibility = {
  showArrival: boolean;
  showDeparture: boolean;
};

export function getStopTimeFieldsVisibility(
  category: RouteStopCategory,
): StopTimeFieldsVisibility {
  if (category === "origin") {
    return { showArrival: false, showDeparture: true };
  }
  if (category === "destination") {
    return { showArrival: true, showDeparture: false };
  }
  return { showArrival: true, showDeparture: true };
}

export function formatStopTimeForDisplay(date?: Date | null): string {
  if (!date) return "—";
  return formatDateTime(date.toISOString());
}

export type TripScheduleTimes = {
  scheduledDeparture?: Date;
  actualDeparture?: Date | null;
};

export type StopTimeDisplayRow = {
  kind: StopTimeFieldKind;
  label: string;
  value: string;
};

/**
 * Filas de tiempo a mostrar en UI según rol de la parada.
 * Origen: solo salida (parada o programación del viaje).
 */
export function getStopTimeDisplayRows(
  stop: TripStop,
  category: RouteStopCategory,
  tripTimes?: TripScheduleTimes,
): StopTimeDisplayRow[] {
  if (category === "origin") {
    const actual = stop.actualDeparture ?? tripTimes?.actualDeparture ?? null;
    const scheduled =
      stop.estimatedDeparture ?? tripTimes?.scheduledDeparture ?? null;
    const usesTripSchedule =
      !stop.estimatedDeparture &&
      !stop.actualDeparture &&
      tripTimes?.scheduledDeparture != null;

    if (actual) {
      return [
        {
          kind: "departure",
          label: copy.label.actualDeparture,
          value: formatStopTimeForDisplay(actual),
        },
      ];
    }

    return [
      {
        kind: "departure",
        label: usesTripSchedule
          ? copy.label.scheduledDepartureTrip
          : copy.label.scheduledDeparture,
        value: formatStopTimeForDisplay(scheduled),
      },
    ];
  }

  if (category === "destination") {
    return [
      {
        kind: "arrival",
        label: stop.actualArrival
          ? copy.label.actualArrival
          : copy.label.estimatedArrivalDestination,
        value: formatStopTimeForDisplay(stop.actualArrival ?? stop.estimatedArrival),
      },
    ];
  }

  return [
    {
      kind: "arrival",
      label: stop.actualArrival
        ? copy.label.actualArrival
        : copy.label.estimatedArrivalWaypoint,
      value: formatStopTimeForDisplay(stop.actualArrival ?? stop.estimatedArrival),
    },
    {
      kind: "departure",
      label: stop.actualDeparture
        ? copy.label.actualDeparture
        : copy.label.estimatedDepartureWaypoint,
      value: formatStopTimeForDisplay(stop.actualDeparture ?? stop.estimatedDeparture),
    },
  ];
}

export type StopOperationalVisitState = "pending" | "at_stop" | "visited";

export function getStopOperationalVisitState(
  stop: TripStop,
  category: RouteStopCategory,
  tripTimes?: TripScheduleTimes,
): StopOperationalVisitState {
  if (stop.status === StopStatus.COMPLETED) {
    return "visited";
  }

  if (category === "origin") {
    if (stop.actualDeparture || tripTimes?.actualDeparture) return "visited";
    return "pending";
  }
  if (category === "destination") {
    if (stop.actualArrival) return "at_stop";
    return "pending";
  }
  if (stop.actualArrival && !stop.actualDeparture) return "at_stop";
  return "pending";
}

export function getStopOperationalVisitLabel(
  state: StopOperationalVisitState,
  category?: RouteStopCategory,
): string {
  if (state === "visited") return stopBadgeCopy.stopCompleted;
  if (state === "at_stop") {
    return category === "destination"
      ? stopBadgeCopy.stopAtDestination
      : stopBadgeCopy.stopAtWaypoint;
  }
  return stopBadgeCopy.stopPending;
}

/** Parada con tramo cerrado en tracking (`status === completed`). */
export function isStopOperativelyComplete(
  stop: TripStop,
  category?: RouteStopCategory,
  tripTimes?: TripScheduleTimes,
): boolean {
  void category;
  void tripTimes;
  return stop.status === StopStatus.COMPLETED;
}

export function countOperativelyCompleteStops(
  stops: readonly TripStop[],
  tripTimes?: TripScheduleTimes,
): number {
  return stops.filter((stop) =>
    isStopOperativelyComplete(stop, getRouteStopCategory(stop), tripTimes),
  ).length;
}

/** Campos de tiempo editables en el sheet operativo por categoría de parada. */
export type StopOperationalEditTimeFields = {
  showEstimatedArrival: boolean;
  showEstimatedDeparture: boolean;
};

export function getStopOperationalEditTimeFields(
  category: RouteStopCategory,
): StopOperationalEditTimeFields {
  if (category === "origin") {
    return { showEstimatedArrival: false, showEstimatedDeparture: false };
  }
  if (category === "destination") {
    return { showEstimatedArrival: true, showEstimatedDeparture: false };
  }
  return { showEstimatedArrival: true, showEstimatedDeparture: true };
}
