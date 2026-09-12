import type { Trip } from "@features/trips/domain";

import type { TripFleetAssignmentFormValues } from "./fleetAssignmentValidation";

type TrailerRef = { trailerId: string; position: 1 | 2 };

function trailerKey(t: TrailerRef): string {
  return `${t.position}:${t.trailerId}`;
}

function normalizeTrailerKeys(
  trailers: ReadonlyArray<TrailerRef> | null | undefined,
): string[] {
  return (trailers ?? [])
    .map((t) => trailerKey({ trailerId: t.trailerId, position: t.position }))
    .sort();
}

function sameTrailerKeys(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((key, i) => key === b[i]);
}

/**
 * True when form values change Carta Porte / autotransporte fields vs trip snapshot.
 * Equipo de apoyo y allow_expired_docs no son CP-relevantes.
 */
export function isFleetAssignmentCpRelevantChange(
  trip: Trip,
  values: Pick<
    TripFleetAssignmentFormValues,
    "vehicleId" | "driverId" | "trailers"
  >,
): boolean {
  const currentVehicleId = trip.vehicle?.id ?? trip.vehicleId ?? "";
  const currentDriverId = trip.driver?.id ?? trip.driverId ?? "";

  if (values.vehicleId !== currentVehicleId) return true;
  if (values.driverId !== currentDriverId) return true;

  const tripTrailers: TrailerRef[] =
    trip.trailers?.map((t) => ({
      trailerId: t.trailerId,
      position: t.position,
    })) ?? [];

  return !sameTrailerKeys(
    normalizeTrailerKeys(tripTrailers),
    normalizeTrailerKeys(values.trailers),
  );
}
