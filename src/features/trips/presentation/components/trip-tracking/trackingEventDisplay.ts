import type { TrackingEvent } from "@features/trips/domain";
import { trackingCopy } from "../../copy";

const INCIDENT_SEVERITY_LABELS: Record<string, string> = {
  low: "Severidad baja",
  medium: "Severidad media",
  high: "Severidad alta",
};

function readPayloadString(
  payload: Record<string, unknown>,
  key: string,
): string | null {
  const value = payload[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * F7.6: descripción del incidente más reciente en timeline (sin endpoint nuevo).
 * Solo lectura de eventos ya cargados; no inventa cierre.
 */
export function resolveLatestIncidentDetail(
  events: readonly Pick<
    TrackingEvent,
    "eventType" | "notes" | "payload" | "occurredAt"
  >[],
): string | null {
  let latest: (typeof events)[number] | null = null;
  for (const event of events) {
    if (event.eventType !== "incident") continue;
    if (
      latest == null ||
      event.occurredAt.getTime() > latest.occurredAt.getTime()
    ) {
      latest = event;
    }
  }
  return latest ? getTrackingEventTimelineBody(latest) : null;
}

/** Texto principal del evento en timeline (notas e incidentes). */
export function getTrackingEventTimelineBody(
  event: Pick<TrackingEvent, "eventType" | "notes" | "payload">,
): string | null {
  if (event.eventType === "incident") {
    const fromPayload = readPayloadString(event.payload, "description");
    if (fromPayload) return fromPayload;
  }

  if (event.eventType === "false_trip_declared") {
    return null;
  }

  if (event.notes?.trim()) {
    return event.notes.trim();
  }

  return null;
}

/** Metadatos secundarios para incidentes (severidad, asistencia). */
export function getTrackingIncidentTimelineMeta(
  event: Pick<TrackingEvent, "eventType" | "payload">,
): string[] {
  if (event.eventType !== "incident") return [];

  const lines: string[] = [];
  const severity = event.payload.severity;
  if (typeof severity === "string" && INCIDENT_SEVERITY_LABELS[severity]) {
    lines.push(INCIDENT_SEVERITY_LABELS[severity]!);
  }
  if (event.payload.requires_assistance === true) {
    lines.push("Requiere asistencia");
  }
  return lines;
}

/**
 * T5: chip «Cerrado» = proyección UI desde `!hasOpenIncident`.
 * No muta eventos `incident` ni inventa `incident_resolved`.
 */
export function shouldShowIncidentClosedChip(
  eventType: Pick<TrackingEvent, "eventType">["eventType"],
  hasOpenIncident: boolean,
): boolean {
  return eventType === "incident" && !hasOpenIncident;
}

function displayTrackingActor(
  name: string | null | undefined,
  id: string | null | undefined,
): string | null {
  const trimmedName = name?.trim();
  if (trimmedName) return trimmedName;
  const trimmedId = id?.trim();
  if (!trimmedId) return null;
  const looksLikeUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      trimmedId,
    );
  return looksLikeUuid ? null : trimmedId;
}

/** PD7: causa, km, actor del evento `false_trip_declared`. */
export function getFalseTripDeclaredTimelineMeta(
  event: Pick<
    TrackingEvent,
    "eventType" | "notes" | "mileage" | "capturedBy" | "capturedByName"
  >,
  declaredByFromTrip?: string | null,
): string[] {
  if (event.eventType !== "false_trip_declared") return [];

  const lines: string[] = [];
  const cause = event.notes?.trim();
  if (cause) {
    lines.push(trackingCopy.hint.timelineCause(cause));
  }
  if (event.mileage != null && Number.isFinite(event.mileage)) {
    lines.push(
      trackingCopy.hint.timelineMileage(event.mileage.toLocaleString("es-MX")),
    );
  }
  const actor =
    displayTrackingActor(event.capturedByName, event.capturedBy) ||
    declaredByFromTrip?.trim() ||
    null;
  if (actor) {
    lines.push(trackingCopy.hint.timelineActor(actor));
  }
  return lines;
}

function returnPlannedWhenLabel(timing: string): string {
  if (timing === "before_continuing") {
    return trackingCopy.planReturn.bitacoraWhenBefore;
  }
  return trackingCopy.planReturn.bitacoraWhenAtEnd;
}

/**
 * Título Bitácora R10: `Retorno planeado · {lugar} {cuándo}`.
 * Fallback a etiqueta corta si falta payload.
 */
export function getReturnPlannedTimelineTitle(
  event: Pick<TrackingEvent, "eventType" | "payload">,
): string | null {
  if (event.eventType !== "return_planned") return null;
  const place =
    readPayloadString(event.payload, "destination_label") ??
    readPayloadString(event.payload, "place_label");
  if (!place) return trackingCopy.planReturn.toastSaved;
  const timingRaw = event.payload.timing;
  const timing = typeof timingRaw === "string" ? timingRaw : "at_end";
  return trackingCopy.planReturn.bitacora(place, returnPlannedWhenLabel(timing));
}

/**
 * Meta Bitácora R10: `+{n} km · {nombreUsuario}` (parcial si falta un dato).
 */
export function getReturnPlannedTimelineMeta(
  event: Pick<
    TrackingEvent,
    "eventType" | "payload" | "capturedBy" | "capturedByName"
  >,
): string[] {
  if (event.eventType !== "return_planned") return [];

  const kmRaw =
    event.payload.estimated_extra_km ?? event.payload.delta_km ?? null;
  const km =
    typeof kmRaw === "number" && Number.isFinite(kmRaw) && kmRaw >= 0
      ? kmRaw
      : null;
  const actor = displayTrackingActor(event.capturedByName, event.capturedBy);

  if (km != null && actor) {
    return [
      trackingCopy.planReturn.bitacoraMeta(
        km.toLocaleString("es-MX"),
        actor,
      ),
    ];
  }
  const lines: string[] = [];
  if (km != null) {
    lines.push(`+${km.toLocaleString("es-MX")} km`);
  }
  if (actor) {
    lines.push(actor);
  }
  return lines;
}
