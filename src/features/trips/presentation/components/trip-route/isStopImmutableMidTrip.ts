import { StopStatus, type TripStop } from "@features/trips/domain";

export type StopLikeForImmutability = {
  status: string;
  stopType: string | string[];
  actualDeparture?: Date | string | null;
};

function normalizeStopTypes(stopType: string | string[]): string[] {
  return Array.isArray(stopType) ? stopType : [stopType];
}

export function isOriginStopType(stopType: string | string[]): boolean {
  return normalizeStopTypes(stopType).includes("origin");
}

/**
 * ADR-0093 E1 — true si la parada no puede mutarse vía `PUT …/stops:replan` mid-trip.
 * Alineado a contrato API (`isStopImmutableMidTrip`).
 */
export function isStopImmutableMidTrip(stop: StopLikeForImmutability): boolean {
  if (stop.status !== StopStatus.PENDING && stop.status !== "pending") {
    return true;
  }
  if (isOriginStopType(stop.stopType) && stop.actualDeparture != null) {
    return true;
  }
  return false;
}

export function isTripStopImmutableMidTrip(stop: TripStop): boolean {
  return isStopImmutableMidTrip({
    status: stop.status,
    stopType: stop.stopType,
    actualDeparture: stop.actualDeparture,
  });
}

