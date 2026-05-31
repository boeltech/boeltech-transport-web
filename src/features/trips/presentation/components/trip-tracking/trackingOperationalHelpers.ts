import type { TripStatusType, TripStop } from "@features/trips/domain";
import {
  getRouteStopCategory,
  getStopOperationalVisitLabel,
  getStopOperationalVisitState,
  type RouteStopCategory,
  type StopOperationalVisitState,
  type TripScheduleTimes,
} from "../trip-route/tripRouteDetailHelpers";
import {
  findActiveEscalaForDeparture,
  findDestinationAwaitingTripArrival,
  findNextStopForArrival,
  isManualArrivalStop,
  isOriginStop,
  isTrackingEscalaStop,
} from "../trackingStopEligibility";
import { trackingCopy } from "./trackingCopy";

export type TrackingStopNextAction =
  | "register_arrival"
  | "register_departure"
  | "close_at_destination"
  | null;

export type TrackingItineraryRow = {
  stop: TripStop;
  displayOrder: number;
  category: RouteStopCategory;
  visitState: StopOperationalVisitState;
  visitLabel: string;
  nextAction: TrackingStopNextAction;
  isActionTarget: boolean;
};

export function resolveTrackingNextAction(
  stops: readonly TripStop[],
): TrackingStopNextAction {
  const ordered = [...stops];
  if (findActiveEscalaForDeparture(ordered)) return "register_departure";
  if (findNextStopForArrival(ordered)) return "register_arrival";
  if (findDestinationAwaitingTripArrival(ordered)) {
    return "close_at_destination";
  }
  return null;
}

export function getTrackingNextActionLabel(action: TrackingStopNextAction): string | null {
  if (action === "register_arrival") return trackingCopy.action.arrive;
  if (action === "register_departure") return trackingCopy.action.depart;
  if (action === "close_at_destination") return trackingCopy.action.close;
  return null;
}

export function buildTrackingItineraryRows(
  stops: readonly TripStop[],
  tripTimes?: TripScheduleTimes,
): TrackingItineraryRow[] {
  const ordered = [...stops].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  const globalNext = resolveTrackingNextAction(ordered);
  const nextDepartureStop = findActiveEscalaForDeparture(ordered);
  const nextArrivalStop = findNextStopForArrival(ordered);
  const destinationClosure = findDestinationAwaitingTripArrival(ordered);

  return ordered.map((stop, index) => {
    const category = getRouteStopCategory(stop);
    const visitState = getStopOperationalVisitState(stop, category, tripTimes);
    let nextAction: TrackingStopNextAction = null;

    if (
      globalNext === "register_departure" &&
      nextDepartureStop?.id === stop.id
    ) {
      nextAction = "register_departure";
    } else if (globalNext === "register_arrival" && nextArrivalStop?.id === stop.id) {
      nextAction = "register_arrival";
    } else if (
      globalNext === "close_at_destination" &&
      destinationClosure?.id === stop.id
    ) {
      nextAction = "close_at_destination";
    }

    return {
      stop,
      displayOrder: index + 1,
      category,
      visitState,
      visitLabel: getStopOperationalVisitLabel(visitState),
      nextAction,
      isActionTarget: nextAction != null,
    };
  });
}

export function getTrackingScopeAlertItems(
  tripStatus: TripStatusType,
  hasOpenIncident: boolean,
): { label?: string; text: string }[] {
  const items: { label?: string; text: string }[] = [
    {
      text: trackingCopy.hint.scope,
    },
  ];

  if (tripStatus === "scheduled") {
    items.push({
      text: "Inicia viaje para habilitar llegadas, salidas y registro operativo.",
    });
  } else if (tripStatus !== "in_progress") {
    items.push({
      text: "Seguimiento en solo lectura para este estado.",
    });
  }

  if (hasOpenIncident) {
    items.push({
      label: "Incidente",
      text: trackingCopy.hint.openIncident,
    });
  }

  return items;
}

/** Etiqueta corta del rol de la parada en el itinerario de seguimiento. */
export function getTrackingStopRoleHint(stop: TripStop): string | null {
  if (isOriginStop(stop)) {
    return "Salida al iniciar viaje";
  }
  if (isManualArrivalStop(stop) && isTrackingEscalaStop(stop)) {
    return "Llegada y salida manual";
  }
  if (isManualArrivalStop(stop)) {
    return "Llegada manual y cierre en destino";
  }
  return null;
}
