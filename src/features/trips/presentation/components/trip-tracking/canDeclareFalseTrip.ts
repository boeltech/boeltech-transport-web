import {
  CargoStatus,
  TripStatus,
  type TripCargo,
  type TripStatusType,
  type TripStop,
} from "@features/trips/domain";

/**
 * Elegibilidad UX/API para declarar viaje en falso (ADR-0079 / PD1).
 * in_progress + ≥1 llegada real + ninguna carga delivered.
 */
export function canDeclareFalseTrip(
  tripStatus: TripStatusType,
  stops: readonly TripStop[],
  cargos: readonly TripCargo[] = [],
): boolean {
  if (tripStatus !== TripStatus.IN_PROGRESS) return false;
  const hasRealArrival = stops.some((stop) => stop.actualArrival != null);
  if (!hasRealArrival) return false;
  return !cargos.some((cargo) => cargo.status === CargoStatus.DELIVERED);
}
