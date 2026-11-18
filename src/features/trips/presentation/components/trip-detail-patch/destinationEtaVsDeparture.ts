import { localInputToUtcIso } from "@shared/utils/dateUtils";

/**
 * Copy alineado a UpdateTripUseCase / INVALID_ARRIVAL_DATE / Programación.
 * F9g — bloquear Destino antes de replace/replan.
 */
export const DESTINATION_ETA_MUST_BE_AFTER_DEPARTURE =
  "La fecha de llegada debe ser posterior a la de salida";

/**
 * F9g — ¿la ETA (datetime-local) es estrictamente posterior a la salida del viaje?
 * Misma semántica que `UpdateTripUseCase` (`arrival > departure`).
 * El caller omite ETA vacía (D-F9g-4); este helper asume valor no vacío.
 */
export function isDestinationEtaAfterDeparture(
  estimatedArrivalLocal: string,
  scheduledDeparture: Date,
): boolean {
  const trimmed = estimatedArrivalLocal.trim();
  const arrivalMs = new Date(localInputToUtcIso(trimmed)).getTime();
  if (Number.isNaN(arrivalMs)) return false;
  return arrivalMs > scheduledDeparture.getTime();
}
