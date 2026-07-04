import type { Trip, TripStop } from "@features/trips/domain";

import { getRouteStopCategory } from "../trip-route/tripRouteDetailHelpers";
import {
  mapTripStopToOperationalValues,
  type TripScheduleFormValues,
  type TripStopOperationalValues,
} from "./tripStopOperationalFields";

export function findDestinationStop(trip: Trip): TripStop | undefined {
  return (trip.stops ?? []).find((stop) => getRouteStopCategory(stop) === "destination");
}

/** Valores datetime-local para override de programación del viaje. */
export function buildScheduleOverrideFromTrip(
  _trip: Trip,
  schedule: TripScheduleFormValues,
): { scheduledDeparture: string; scheduledArrival: string } {
  return {
    scheduledDeparture: schedule.scheduledDeparture,
    scheduledArrival: schedule.scheduledArrival,
  };
}

/** Copia `scheduledArrival` del viaje en la llegada estimada de la parada destino. */
export function mergeDestinationEstimatedArrivalFromSchedule(
  trip: Trip,
  schedule: TripScheduleFormValues,
): Map<string, TripStopOperationalValues> {
  const destination = findDestinationStop(trip);
  if (!destination) return new Map();

  const base = mapTripStopToOperationalValues(destination);
  return new Map([
    [
      destination.id,
      {
        ...base,
        estimatedArrival: schedule.scheduledArrival,
      },
    ],
  ]);
}
