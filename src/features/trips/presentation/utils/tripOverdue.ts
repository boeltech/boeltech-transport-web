/**
 * Utilidades de viaje vencido (overdue) — lockstep con dashboard API.
 */
import { TripStatus, type TripStatusType } from "../../domain";

/** Lockstep @modules/trips/domain/trip-overdue.constants (API). */
export const TRIP_OVERDUE_ERROR_THRESHOLD_HOURS = 24;

export type TripOverdueSeverity = "warning" | "error";

export type TripOverdueState =
  | { isOverdue: false }
  | {
      isOverdue: true;
      hoursOverdue: number;
      severity: TripOverdueSeverity;
    };

export function tripOverdueSeverityFromHours(
  hoursOverdue: number,
): TripOverdueSeverity {
  return hoursOverdue > TRIP_OVERDUE_ERROR_THRESHOLD_HOURS ? "error" : "warning";
}

export function getTripOverdueState(trip: {
  status: TripStatusType;
  scheduledArrival: Date | null;
  now?: Date;
}): TripOverdueState {
  if (trip.status !== TripStatus.IN_PROGRESS || trip.scheduledArrival == null) {
    return { isOverdue: false };
  }

  const now = trip.now ?? new Date();
  const arrivalMs = trip.scheduledArrival.getTime();
  if (arrivalMs >= now.getTime()) {
    return { isOverdue: false };
  }

  const hoursOverdue = Math.max(
    1,
    Math.round((now.getTime() - arrivalMs) / (1000 * 60 * 60)),
  );

  return {
    isOverdue: true,
    hoursOverdue,
    severity: tripOverdueSeverityFromHours(hoursOverdue),
  };
}
