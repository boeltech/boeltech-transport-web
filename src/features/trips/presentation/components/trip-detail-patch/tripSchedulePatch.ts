import { getOrderedStops, type CreateStopInput, type Trip, type UpdateTripInput } from "@features/trips/domain";
import { localInputToUtcIso } from "@shared/utils/dateUtils";

import { mapStopToReplaceStopInput } from "./mapStopToCreateStopInput";
import {
  findDestinationStop,
  mergeDestinationEstimatedArrivalFromSchedule,
} from "./tripScheduledArrivalSync";
import type { TripScheduleFormValues } from "./tripStopOperationalFields";

/**
 * Payload de programación para `PUT /trips/:id`: solo fechas del viaje.
 * No incluir `stops` — el API interpreta stops como replace de ruta y, sin cargos,
 * borra cargas/gastos; además `address_id` de snapshot provoca STOP_ADDRESS_NOT_FOUND.
 */
export function buildScheduleUpdateInput(
  _trip: Trip,
  values: TripScheduleFormValues,
): UpdateTripInput {
  return {
    scheduledDeparture: localInputToUtcIso(values.scheduledDeparture),
    scheduledArrival: values.scheduledArrival
      ? localInputToUtcIso(values.scheduledArrival)
      : null,
  };
}

/**
 * Ruta completa para `PUT /trips/:id/stops` tras cambiar la programación,
 * sincronizando `estimatedArrival` del destino. Usa mapper sin `addressId`
 * de snapshot (ADR-0055).
 */
export function buildScheduleDestinationEtaReplaceStops(
  trip: Trip,
  values: TripScheduleFormValues,
): CreateStopInput[] | null {
  const destination = findDestinationStop(trip);
  const ordered = getOrderedStops(trip.stops ?? []);
  if (!destination || ordered.length < 2) return null;

  const editedById = mergeDestinationEstimatedArrivalFromSchedule(trip, values);
  return ordered.map((stop) =>
    mapStopToReplaceStopInput(stop, editedById.get(stop.id)),
  );
}
