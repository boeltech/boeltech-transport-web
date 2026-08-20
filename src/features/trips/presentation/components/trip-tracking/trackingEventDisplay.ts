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

/** PD7: causa, km, actor del evento `false_trip_declared`. */
export function getFalseTripDeclaredTimelineMeta(
  event: Pick<TrackingEvent, "eventType" | "notes" | "mileage" | "capturedBy">,
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
  const actor = event.capturedBy?.trim() || declaredByFromTrip?.trim();
  if (actor) {
    lines.push(trackingCopy.hint.timelineActor(actor));
  }
  return lines;
}
