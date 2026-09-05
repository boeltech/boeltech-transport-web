import {
  getOrderedStops,
  TripOperationalOutcome,
  TripStatus,
  type TripCargo,
  type TripOperationalOutcomeType,
  type TripStatusType,
  type TripStop,
} from "@features/trips/domain";

import { isDestinationStop } from "../trackingStopEligibility";
import {
  hasUnresolvedCargoAtStop,
  isStopVisitActive,
} from "../../utils/trackingCargoGating";

function findDestinationStop(stops: readonly TripStop[]): TripStop | undefined {
  const ordered = getOrderedStops(stops);
  for (let i = ordered.length - 1; i >= 0; i -= 1) {
    const stop = ordered[i];
    if (stop && isDestinationStop(stop)) return stop;
  }
  return undefined;
}

/**
 * Elegibilidad UX para atajo «Completar viaje» (ADR-0088 / PD2).
 * Oculta cuando cargo gating bloquearía `trip_arrived` en destino con visita activa.
 */
export function canQuickCloseTrip(
  tripStatus: TripStatusType,
  stops: readonly TripStop[],
  cargos: readonly TripCargo[] = [],
  operationalOutcome: TripOperationalOutcomeType = TripOperationalOutcome.STANDARD,
): boolean {
  if (tripStatus !== TripStatus.IN_PROGRESS) return false;
  if (operationalOutcome === TripOperationalOutcome.FALSE_TRIP) return false;

  const orderedStops = getOrderedStops(stops);
  const destination = findDestinationStop(orderedStops);
  if (destination?.actualArrival != null) {
    if (isStopVisitActive(destination, tripStatus)) {
      if (hasUnresolvedCargoAtStop(destination, cargos, orderedStops)) {
        return false;
      }
    }
  }

  return true;
}
