/**
 * Resuelve quién / cuándo / motivo de la declaración de viaje en falso (D20 / F-11).
 * Preferencia: evento timeline `false_trip_declared`; fallback campos del trip.
 * El API guarda UUID en `captured_by` / `false_trip_declared_by`; para UI se
 * prefiere `capturedByName` / `falseTripDeclaredByName`.
 */

import type { TrackingEvent, Trip } from "@features/trips/domain";

export type FalseTripDeclaration = {
  declaredBy: string | null;
  declaredAt: Date | null;
  reason: string | null;
};

function displayActorName(
  name: string | null | undefined,
  id: string | null | undefined,
): string | null {
  const trimmedName = name?.trim();
  if (trimmedName) return trimmedName;
  // No mostrar UUID crudo como «nombre».
  const trimmedId = id?.trim();
  if (!trimmedId) return null;
  const looksLikeUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      trimmedId,
    );
  return looksLikeUuid ? null : trimmedId;
}

export function resolveFalseTripDeclaration(params: {
  trip: Pick<
    Trip,
    | "falseTripDeclaredAt"
    | "falseTripDeclaredBy"
    | "falseTripDeclaredByName"
  >;
  events?: readonly Pick<
    TrackingEvent,
    "eventType" | "notes" | "capturedBy" | "capturedByName" | "occurredAt"
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
        displayActorName(declared.capturedByName, declared.capturedBy) ||
        displayActorName(
          trip.falseTripDeclaredByName,
          trip.falseTripDeclaredBy,
        ),
      declaredAt: declared.occurredAt,
      reason: declared.notes?.trim() || null,
    };
  }

  return {
    declaredBy: displayActorName(
      trip.falseTripDeclaredByName,
      trip.falseTripDeclaredBy,
    ),
    declaredAt: trip.falseTripDeclaredAt,
    reason: null,
  };
}
