import type { TripCargo, TripStatusType, TripStop } from "@features/trips/domain";
import { TripStatus } from "@features/trips/domain";
import { getCargoBlockAtStop } from "../../utils/trackingCargoGating";

import {
  formatArrivalButtonLabel,
  formatDepartOriginButtonLabel,
  formatDepartureButtonLabel,
  formatTripArrivalButtonLabel,
  resolveStopDisplayOrder,
} from "../trackingActionLabels";
import {
  findActiveEscalaForDeparture,
  findDestinationAwaitingTripArrival,
  findNextStopForArrival,
  findOriginAwaitingDeparture,
  isOriginStop,
} from "../trackingStopEligibility";
import {
  findStopAwaitingCargoResolution,
  resolveTrackingNextAction,
} from "./trackingOperationalHelpers";
import {
  STOP_TRANSITION_COPY,
  legendCopy,
} from "./transitionCopy";
import { trackingCopy } from "../../copy";

export type TrackingPrimaryActionKind =
  | "dispatch"
  | "arrive"
  | "depart"
  | "depart_origin"
  | "close"
  | "cargo_blocked"
  | "origin_outcome"
  | "plan_return"
  | "idle"
  | "none";

export type TrackingPrimaryAction = {
  kind: TrackingPrimaryActionKind;
  title: string;
  transitionText: string | null;
  stop?: TripStop;
  displayOrder?: number;
};

export type ResolveTrackingPrimaryActionOptions = {
  canMutateCargo?: boolean;
  /** GET aditivo — bloquea salida/cierre hasta falso o cancelar viaje. */
  originNoCargoPendingOutcome?: boolean;
  /** GET aditivo — bloquea cierre hasta replan de retorno. */
  returnReplanRequired?: boolean;
};

function formatStopLabel(
  stop: TripStop | undefined,
  displayOrder: number | undefined,
): string {
  if (stop?.locationName?.trim()) return stop.locationName.trim();
  if (displayOrder != null) return `parada #${displayOrder}`;
  return "esta parada";
}

export function resolveTrackingPrimaryAction(
  tripStatus: TripStatusType,
  stops: readonly TripStop[],
  cargos?: readonly TripCargo[],
  options?: ResolveTrackingPrimaryActionOptions,
): TrackingPrimaryAction {
  const ordered = [...stops];
  const originNoCargoPendingOutcome =
    options?.originNoCargoPendingOutcome === true;
  const returnReplanRequired = options?.returnReplanRequired === true;

  if (tripStatus === TripStatus.SCHEDULED) {
    const origin = ordered.find((stop) => isOriginStop(stop));
    return {
      kind: "dispatch",
      title: trackingCopy.action.start,
      transitionText: STOP_TRANSITION_COPY.dispatch,
      stop: origin,
      displayOrder: origin
        ? resolveStopDisplayOrder(ordered, origin.id)
        : undefined,
    };
  }

  if (tripStatus !== TripStatus.IN_PROGRESS) {
    return {
      kind: "none",
      title: trackingCopy.state.readOnly,
      transitionText: null,
    };
  }

  if (originNoCargoPendingOutcome) {
    return {
      kind: "origin_outcome",
      title: trackingCopy.hint.originNoCargoOutcomeTitle,
      transitionText: trackingCopy.hint.originNoCargoOutcomeBody,
    };
  }

  const next = resolveTrackingNextAction(ordered, cargos, tripStatus);

  if (next === "resolve_cargo_at_stop") {
    const stop = cargos?.length
      ? findStopAwaitingCargoResolution(ordered, cargos)
      : undefined;
    const displayOrder = stop
      ? resolveStopDisplayOrder(ordered, stop.id)
      : undefined;
    const block = stop
      ? getCargoBlockAtStop(stop, cargos ?? [], ordered)
      : { blocked: true, pendingCount: 0, descriptions: [] };
    const stopLabel = formatStopLabel(stop, displayOrder);
    const canMutateCargo = options?.canMutateCargo !== false;
    return {
      kind: "cargo_blocked",
      title: canMutateCargo
        ? trackingCopy.hint.cargoBlockedTitle(stopLabel)
        : trackingCopy.hint.cargoBlockedTitleDriver(stopLabel),
      transitionText: canMutateCargo
        ? trackingCopy.hint.cargoBlockedBody(block.pendingCount)
        : trackingCopy.hint.cargoBlockedBodyDriver,
      stop,
      displayOrder,
    };
  }

  if (next === "depart_origin") {
    const stop = findOriginAwaitingDeparture(ordered);
    const displayOrder = stop
      ? resolveStopDisplayOrder(ordered, stop.id)
      : undefined;
    return {
      kind: "depart_origin",
      title: formatDepartOriginButtonLabel(stop, displayOrder),
      transitionText: STOP_TRANSITION_COPY.departOrigin,
      stop,
      displayOrder,
    };
  }

  if (next === "register_departure") {
    const stop = findActiveEscalaForDeparture(ordered);
    const displayOrder = stop
      ? resolveStopDisplayOrder(ordered, stop.id)
      : undefined;
    return {
      kind: "depart",
      title: formatDepartureButtonLabel(stop, displayOrder),
      transitionText: STOP_TRANSITION_COPY.depart,
      stop,
      displayOrder,
    };
  }

  if (next === "register_arrival") {
    const stop = findNextStopForArrival(ordered);
    const displayOrder = stop
      ? resolveStopDisplayOrder(ordered, stop.id)
      : undefined;
    return {
      kind: "arrive",
      title: formatArrivalButtonLabel(stop, displayOrder),
      transitionText: STOP_TRANSITION_COPY.arrive,
      stop,
      displayOrder,
    };
  }

  if (next === "close_at_destination") {
    if (returnReplanRequired) {
      return {
        kind: "plan_return",
        title: trackingCopy.action.planReturn,
        transitionText: trackingCopy.hint.planReturnBlockedClose,
      };
    }
    const stop = findDestinationAwaitingTripArrival(ordered);
    const displayOrder = stop
      ? resolveStopDisplayOrder(ordered, stop.id)
      : undefined;
    return {
      kind: "close",
      title: formatTripArrivalButtonLabel(stop, displayOrder),
      transitionText: STOP_TRANSITION_COPY.close,
      stop,
      displayOrder,
    };
  }

  if (returnReplanRequired) {
    return {
      kind: "plan_return",
      title: trackingCopy.action.planReturn,
      transitionText: trackingCopy.hint.planReturnBlockedClose,
    };
  }

  return {
    kind: "idle",
    title: legendCopy.nextAction.idle,
    transitionText: null,
  };
}

/**
 * CTA corto (verbo + objeto) para Qué sigue — el título contextual largo
 * sigue en `TrackingPrimaryAction.title` (P2-1 / F5c).
 */
export function resolveTrackingPrimaryCtaLabel(
  action: TrackingPrimaryAction,
): string {
  switch (action.kind) {
    case "dispatch":
      return trackingCopy.action.start;
    case "arrive":
      return trackingCopy.action.arrive;
    case "depart":
      return trackingCopy.action.depart;
    case "depart_origin":
      return trackingCopy.action.departOrigin;
    case "close":
      return trackingCopy.action.close;
    case "cargo_blocked":
      return trackingCopy.action.goToCargos;
    case "origin_outcome":
      return trackingCopy.action.declareFalseTrip;
    case "plan_return":
      return trackingCopy.action.planReturn;
    case "idle":
    case "none":
      return action.title;
  }
}
