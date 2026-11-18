import { getOrderedStops, type CreateStopInput, type Trip, type UpdateTripInput } from "@features/trips/domain";
import { localInputToUtcIso, utcIsoToLocalInput } from "@shared/utils/dateUtils";

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
  const scheduledArrival = values.scheduledArrival.trim();
  return {
    scheduledDeparture: localInputToUtcIso(values.scheduledDeparture),
    // Omitir (no `null`): el schema Zod de update solo acepta ISO o ausente.
    ...(scheduledArrival
      ? { scheduledArrival: localInputToUtcIso(scheduledArrival) }
      : {}),
  };
}

/**
 * F9e — proyección Destino → `trip.scheduledArrival` (espejo wizard).
 * ETA vacía → `null` (no update, no borrar arrival). Mismo instante → `null` (skip).
 * No inventa `scheduledArrival: null`.
 */
export function buildScheduleUpdateFromDestinationEta(
  trip: Trip,
  estimatedArrival: string | null | undefined,
): UpdateTripInput | null {
  const trimmed = estimatedArrival?.trim() ?? "";
  if (!trimmed) return null;

  const nextIso = localInputToUtcIso(trimmed);
  if (
    trip.scheduledArrival != null &&
    trip.scheduledArrival.getTime() === new Date(nextIso).getTime()
  ) {
    return null;
  }

  return buildScheduleUpdateInput(trip, {
    scheduledDeparture: utcIsoToLocalInput(trip.scheduledDeparture.toISOString()),
    scheduledArrival: trimmed,
  });
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
