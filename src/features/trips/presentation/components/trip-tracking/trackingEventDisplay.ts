import type { TrackingEvent } from "@features/trips/domain";

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
