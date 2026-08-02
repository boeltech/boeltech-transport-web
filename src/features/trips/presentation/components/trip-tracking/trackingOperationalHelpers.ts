import {
  TripStatus,
  type TripCargo,
  type TripStatusType,
  type TripStop,
} from "@features/trips/domain";
import {
  getCargoBlockAtStop,
  hasUnresolvedCargoAtStop,
} from "../../utils/trackingCargoGating";
import type { StopTransitionAction } from "./transitionCopy";
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
  findOriginAwaitingDeparture,
  isManualArrivalStop,
  isOriginStop,
  isTrackingEscalaStop,
} from "../trackingStopEligibility";
import { trackingCopy } from "./trackingCopy";

export type TrackingStopNextAction =
  | "register_arrival"
  | "register_departure"
  | "depart_origin"
  | "close_at_destination"
  | "resolve_cargo_at_stop"
  | null;

const DEPARTURE_NEXT_ACTIONS = new Set<TrackingStopNextAction>([
  "depart_origin",
  "register_departure",
  "close_at_destination",
]);

function getStopForDepartureNextAction(
  action: TrackingStopNextAction,
  ordered: readonly TripStop[],
): TripStop | undefined {
  if (action === "depart_origin") return findOriginAwaitingDeparture(ordered);
  if (action === "register_departure") {
    return findActiveEscalaForDeparture(ordered);
  }
  if (action === "close_at_destination") {
    return findDestinationAwaitingTripArrival(ordered);
  }
  return undefined;
}

export function findStopAwaitingCargoResolution(
  ordered: readonly TripStop[],
  cargos: readonly TripCargo[],
): TripStop | undefined {
  const origin = findOriginAwaitingDeparture(ordered);
  if (
    origin &&
    hasUnresolvedCargoAtStop(origin, cargos, ordered)
  ) {
    return origin;
  }
  const escala = findActiveEscalaForDeparture(ordered);
  if (
    escala &&
    hasUnresolvedCargoAtStop(escala, cargos, ordered)
  ) {
    return escala;
  }
  const destination = findDestinationAwaitingTripArrival(ordered);
  if (
    destination &&
    hasUnresolvedCargoAtStop(destination, cargos, ordered)
  ) {
    return destination;
  }
  return undefined;
}

export { getCargoBlockAtStop };

export type InlineStopAction = {
  action: StopTransitionAction;
  label: string;
  variant: "default" | "outline";
};

export type TrackingItineraryRow = {
  stop: TripStop;
  displayOrder: number;
  category: RouteStopCategory;
  visitState: StopOperationalVisitState;
  visitLabel: string;
  nextAction: TrackingStopNextAction;
  isActionTarget: boolean;
};

export function resolveInlineStopAction(
  tripStatus: TripStatusType,
  stop: TripStop,
  nextAction: TrackingStopNextAction,
): InlineStopAction | null {
  if (tripStatus === TripStatus.SCHEDULED && isOriginStop(stop)) {
    return {
      action: "dispatch",
      label: trackingCopy.action.start,
      variant: "default",
    };
  }

  if (tripStatus !== TripStatus.IN_PROGRESS || !nextAction) {
    return null;
  }

  if (nextAction === "register_arrival") {
    return {
      action: "arrive",
      label: trackingCopy.action.arrive,
      variant: "outline",
    };
  }

  if (nextAction === "depart_origin") {
    return {
      action: "departOrigin",
      label: trackingCopy.action.departOrigin,
      variant: "default",
    };
  }

  if (nextAction === "register_departure") {
    return {
      action: "depart",
      label: trackingCopy.action.depart,
      variant: "outline",
    };
  }

  if (nextAction === "close_at_destination") {
    return {
      action: "close",
      label: trackingCopy.action.close,
      variant: "default",
    };
  }

  return null;
}

export function resolveTrackingNextAction(
  stops: readonly TripStop[],
  cargos?: readonly TripCargo[],
): TrackingStopNextAction {
  const ordered = [...stops];
  let base: TrackingStopNextAction = null;
  if (findOriginAwaitingDeparture(ordered)) base = "depart_origin";
  else if (findActiveEscalaForDeparture(ordered)) base = "register_departure";
  else if (findNextStopForArrival(ordered)) base = "register_arrival";
  else if (findDestinationAwaitingTripArrival(ordered)) {
    base = "close_at_destination";
  }

  if (
    base &&
    DEPARTURE_NEXT_ACTIONS.has(base) &&
    cargos &&
    cargos.length > 0
  ) {
    const targetStop = getStopForDepartureNextAction(base, ordered);
    if (
      targetStop &&
      hasUnresolvedCargoAtStop(targetStop, cargos, ordered)
    ) {
      return "resolve_cargo_at_stop";
    }
  }

  return base;
}

export function getTrackingNextActionLabel(action: TrackingStopNextAction): string | null {
  if (action === "register_arrival") return trackingCopy.action.arrive;
  if (action === "register_departure") return trackingCopy.action.depart;
  if (action === "depart_origin") return trackingCopy.action.departOrigin;
  if (action === "close_at_destination") return trackingCopy.action.close;
  return null;
}

export function buildTrackingItineraryRows(
  stops: readonly TripStop[],
  tripTimes?: TripScheduleTimes,
  cargos?: readonly TripCargo[],
): TrackingItineraryRow[] {
  const ordered = [...stops].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  const globalNext = resolveTrackingNextAction(ordered, cargos);
  const originDepartureStop = findOriginAwaitingDeparture(ordered);
  const nextDepartureStop = findActiveEscalaForDeparture(ordered);
  const nextArrivalStop = findNextStopForArrival(ordered);
  const destinationClosure = findDestinationAwaitingTripArrival(ordered);
  const cargoResolutionStop =
    globalNext === "resolve_cargo_at_stop" && cargos?.length
      ? findStopAwaitingCargoResolution(ordered, cargos)
      : undefined;

  return ordered.map((stop, index) => {
    const category = getRouteStopCategory(stop);
    const visitState = getStopOperationalVisitState(stop, category, tripTimes);
    let nextAction: TrackingStopNextAction = null;

    if (
      globalNext === "resolve_cargo_at_stop" &&
      cargoResolutionStop?.id === stop.id
    ) {
      nextAction = "resolve_cargo_at_stop";
    } else if (globalNext === "depart_origin" && originDepartureStop?.id === stop.id) {
      nextAction = "depart_origin";
    } else if (
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
      visitLabel: getStopOperationalVisitLabel(visitState, category),
      nextAction,
      isActionTarget: nextAction != null,
    };
  });
}

/**
 * Alertas de alcance del tab: solo lectura o incidente abierto (D6).
 * No repite el mensaje de «Iniciar viaje» cuando el viaje está programado.
 */
export function getTrackingScopeAlertItems(
  tripStatus: TripStatusType,
  hasOpenIncident: boolean,
): { label?: string; text: string }[] {
  const items: { label?: string; text: string }[] = [];

  if (
    tripStatus !== "scheduled" &&
    tripStatus !== "in_progress"
  ) {
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
    return "Arribo, carga y salida de origen";
  }
  if (isManualArrivalStop(stop) && isTrackingEscalaStop(stop)) {
    return "Llegada y salida manual";
  }
  if (isManualArrivalStop(stop)) {
    return "Llegada manual y cierre en destino";
  }
  return null;
}
