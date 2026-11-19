/**
 * Resuelve quién / cuándo / motivo de la declaración de viaje en falso (D20 / F-11).
 * Preferencia: evento timeline `false_trip_declared`; fallback campos del trip.
 */

import type { TrackingEvent, Trip } from "@features/trips/domain";

export type FalseTripDeclaration = {
  declaredBy: string | null;
  declaredAt: Date | null;
  reason: string | null;
};

export function resolveFalseTripDeclaration(params: {
  trip: Pick<Trip, "falseTripDeclaredAt" | "falseTripDeclaredBy">;
  events?: readonly Pick<
    TrackingEvent,
    "eventType" | "notes" | "capturedBy" | "occurredAt"
  >[];
}): FalseTripDeclaration {
  const { trip, events = [] } = params;
  const declared = [...events]
    .filter((event) => event.eventType === "false_trip_declared")
    .sort(
      (a, b) =>
        b.occurredAt.getTime() - a.occurredAt.getTime(),
    )[0];

  if (declared) {
    return {
      declaredBy:
        declared.capturedBy?.trim() ||
        trip.falseTripDeclaredBy?.trim() ||
        null,
      declaredAt: declared.occurredAt,
      reason: declared.notes?.trim() || null,
    };
  }

  return {
    declaredBy: trip.falseTripDeclaredBy?.trim() || null,
    declaredAt: trip.falseTripDeclaredAt,
    reason: null,
  };
}
