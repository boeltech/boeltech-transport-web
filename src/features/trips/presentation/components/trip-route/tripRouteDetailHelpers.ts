import {
  isCartaPorteListBadgeReady,
  validateOperationalReadiness,
} from "@boeltech/cfdi-domain";
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
  const ordered = [...stops].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  const segments = ordered.slice(1).filter(
    (stop) =>
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
  const ordered = [...stops].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  return ordered.slice(1).filter(
    (stop) =>
      stop.distanceFromPreviousKm == null || stop.distanceFromPreviousKm <= 0,
  ).length;
}

function hasStopCoordinates(
  stop: Pick<TripStop, "latitude" | "longitude"> | undefined,
): boolean {
  return stop?.latitude != null && stop?.longitude != null;
}

function isSegmentDistanceMissing(stop: Pick<TripStop, "distanceFromPreviousKm">): boolean {
  return stop.distanceFromPreviousKm == null || stop.distanceFromPreviousKm <= 0;
}

/** Tramos vacíos cuyo par consecutivo tiene lat/lng (Haversine puede rellenarlos). */
export function countFillableMissingSegmentDistances(
  stops: readonly TripStop[],
): number {
  const ordered = [...stops].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  return ordered.slice(1).filter((stop, index) => {
    const previous = ordered[index];
    return (
      isSegmentDistanceMissing(stop) &&
      hasStopCoordinates(previous) &&
      hasStopCoordinates(stop)
    );
  }).length;
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

export function countStopsMissingDomicilio(stops: readonly TripStop[]): number {
  return stops.filter((stop) => !isStopDomicilioComplete(stop)).length;
}

export function formatDistanceSourceLabel(
  source: TripStop["distanceSource"],
): string | null {
  if (!source) return null;
  if (source === "manual") return copy.label.distanceManual;
  if (source === "mapbox_matrix") return copy.label.distanceMap;
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

export type StopOperationalVisitState =
  | "pending"
  | "at_stop"
  | "visited"
  | "skipped";

export function getStopOperationalVisitState(
  stop: TripStop,
  category: RouteStopCategory,
  tripTimes?: TripScheduleTimes,
): StopOperationalVisitState {
  if (stop.status === StopStatus.SKIPPED) {
    return "skipped";
  }

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
  if (state === "skipped") return stopBadgeCopy.stopSkippedNotVisited;
  if (state === "visited") return stopBadgeCopy.stopCompleted;
  if (state === "at_stop") {
    return category === "destination"
      ? stopBadgeCopy.stopAtDestination
      : stopBadgeCopy.stopAtWaypoint;
  }
  return stopBadgeCopy.stopPending;
}

/** Domicilio SAT listo para CP31 (códigos + geo). RFC no entra: D6 / E-D8. */
export function isStopDomicilioComplete(stop: TripStop): boolean {
  const satReady = isCartaPorteListBadgeReady({
    sat_country_code: stop.satCountryCode,
    sat_state_code: stop.satEstadoCode,
    postal_code: stop.postalCode,
  });
  const geo = validateOperationalReadiness(
    {
      latitude: stop.latitude,
      longitude: stop.longitude,
    },
    { requireCoordinates: true },
  );
  return satReady && geo.ok;
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

/** IDs estables de slots sin `trip_stop` (composer = master). */
export const ROUTE_SLOT_ORIGIN_ID = "slot:origin";
export const ROUTE_SLOT_DESTINATION_ID = "slot:destination";
export const ROUTE_SLOT_WAYPOINT_PREFIX = "slot:waypoint:";

export function isDraftWaypointSlotId(id: string): boolean {
  return id.startsWith(ROUTE_SLOT_WAYPOINT_PREFIX);
}

export type RouteMasterRow = {
  id: string;
  category: RouteStopCategory;
  stop?: TripStop;
  draftLabel?: string | null;
  cityHint?: string | null;
  displayOrder: number;
};

export function buildRouteMasterRows(params: {
  origin?: TripStop;
  destination?: TripStop;
  waypoints: readonly TripStop[];
  originDraftLabel?: string | null;
  destinationDraftLabel?: string | null;
  originCityHint?: string | null;
  destinationCityHint?: string | null;
  waypointDraftIds?: readonly string[];
}): RouteMasterRow[] {
  const {
    origin,
    destination,
    waypoints,
    originDraftLabel,
    destinationDraftLabel,
    originCityHint,
    destinationCityHint,
    waypointDraftIds = [],
  } = params;

  const rows: RouteMasterRow[] = [];
  let order = 1;

  rows.push({
    id: origin?.id ?? ROUTE_SLOT_ORIGIN_ID,
    category: "origin",
    stop: origin,
    draftLabel: origin ? null : (originDraftLabel ?? null),
    cityHint: origin ? null : (originCityHint ?? null),
    displayOrder: order++,
  });

  for (const stop of waypoints) {
    rows.push({
      id: stop.id,
      category: "waypoint",
      stop,
      displayOrder: order++,
    });
  }

  for (const draftId of waypointDraftIds) {
    rows.push({
      id: draftId,
      category: "waypoint",
      displayOrder: order++,
    });
  }

  rows.push({
    id: destination?.id ?? ROUTE_SLOT_DESTINATION_ID,
    category: "destination",
    stop: destination,
    draftLabel: destination ? null : (destinationDraftLabel ?? null),
    cityHint: destination ? null : (destinationCityHint ?? null),
    displayOrder: order++,
  });

  return rows;
}

/** Selección de fila master: id explícito o primer ítem; sin `useEffect`. */
export function resolveRouteMasterRowId(
  rows: readonly RouteMasterRow[],
  selectedId: string | null,
): string | null {
  if (rows.length === 0) return null;
  if (selectedId != null && rows.some((row) => row.id === selectedId)) {
    return selectedId;
  }
  if (selectedId === ROUTE_SLOT_ORIGIN_ID) {
    const origin = rows.find((row) => row.category === "origin");
    if (origin) return origin.id;
  }
  if (selectedId === ROUTE_SLOT_DESTINATION_ID) {
    const destination = rows.find((row) => row.category === "destination");
    if (destination) return destination.id;
  }
  return rows[0]?.id ?? null;
}
