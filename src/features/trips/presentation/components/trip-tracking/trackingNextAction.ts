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
  | "idle"
  | "none";

export type TrackingPrimaryAction = {
  kind: TrackingPrimaryActionKind;
  title: string;
  transitionText: string | null;
  stop?: TripStop;
  displayOrder?: number;
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
): TrackingPrimaryAction {
  const ordered = [...stops];

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

  const next = resolveTrackingNextAction(ordered, cargos);

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
    return {
      kind: "cargo_blocked",
      title: trackingCopy.hint.cargoBlockedTitle(stopLabel),
      transitionText: trackingCopy.hint.cargoBlockedBody(block.pendingCount),
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

  return {
    kind: "idle",
    title: legendCopy.nextAction.idle,
    transitionText: null,
  };
}
