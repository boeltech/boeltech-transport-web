import { describe, expect, it } from "vitest";

import type { TrackingEvent } from "@features/trips/domain";

import {
  getFalseTripDeclaredTimelineMeta,
  getReturnPlannedTimelineMeta,
  getReturnPlannedTimelineTitle,
  getTrackingEventTimelineBody,
  getTrackingIncidentTimelineMeta,
  resolveLatestIncidentDetail,
  shouldShowIncidentClosedChip,
} from "./trackingEventDisplay";
import { trackingCopy } from "../../copy";

function event(
  partial: Partial<TrackingEvent> & Pick<TrackingEvent, "eventType">,
): TrackingEvent {
  return {
    id: "e1",
    tenantId: "t1",
    tripId: "trip-1",
    stopId: null,
    eventCategory: "operational",
    occurredAt: new Date(),
    recordedAt: new Date(),
    latitude: null,
    longitude: null,
    accuracyMeters: null,
    mileage: null,
    payload: {},
    notes: null,
    capturedBy: null,
    capturedByName: null,
    capturedVia: "web",
    idempotencyKey: null,
    ...partial,
  } as TrackingEvent;
}

describe("trackingEventDisplay", () => {
  it("reads note body from notes field", () => {
    expect(
      getTrackingEventTimelineBody(
        event({ eventType: "note", notes: "Ya acabe de comer" }),
      ),
    ).toBe("Ya acabe de comer");
  });

  it("reads incident description from payload", () => {
    expect(
      getTrackingEventTimelineBody(
        event({
          eventType: "incident",
          payload: { description: "Falla en llanta", severity: "high" },
        }),
      ),
    ).toBe("Falla en llanta");
  });

  it("returns incident severity meta", () => {
    expect(
      getTrackingIncidentTimelineMeta(
        event({
          eventType: "incident",
          payload: { severity: "high", requires_assistance: true },
        }),
      ),
    ).toEqual(["Severidad alta", "Requiere asistencia"]);
  });

  it("resolveLatestIncidentDetail toma el incidente más reciente (F7.6)", () => {
    expect(
      resolveLatestIncidentDetail([
        event({
          id: "old",
          eventType: "incident",
          occurredAt: new Date("2026-07-12T10:00:00.000Z"),
          payload: { description: "Viejo" },
        }),
        event({
          id: "note",
          eventType: "note",
          notes: "Ignorar",
          occurredAt: new Date("2026-07-12T11:00:00.000Z"),
        }),
        event({
          id: "new",
          eventType: "incident",
          occurredAt: new Date("2026-07-12T12:00:00.000Z"),
          payload: { description: "Pinchadura en km 120" },
        }),
      ]),
    ).toBe("Pinchadura en km 120");
  });

  it("chip Cerrado solo en incident cuando !hasOpenIncident (T5)", () => {
    expect(shouldShowIncidentClosedChip("incident", false)).toBe(true);
    expect(shouldShowIncidentClosedChip("incident", true)).toBe(false);
    expect(shouldShowIncidentClosedChip("note", false)).toBe(false);
    expect(trackingCopy.hint.incidentClosedChip).toBe("Cerrado");
    expect(trackingCopy.hint.incidentClosedChip).not.toMatch(/resuelto/i);
  });

  it("omits notes body for false_trip_declared and lists cause, km and actor", () => {
    const declared = event({
      eventType: "false_trip_declared",
      notes: "El cliente canceló en sitio",
      mileage: 12500,
      capturedBy: "66d10682-f191-4a6d-91a4-268de3fa0558",
      capturedByName: "Ana Dispatcher",
    });

    expect(getTrackingEventTimelineBody(declared)).toBeNull();
    expect(getFalseTripDeclaredTimelineMeta(declared)).toEqual([
      trackingCopy.hint.timelineCause("El cliente canceló en sitio"),
      trackingCopy.hint.timelineMileage((12500).toLocaleString("es-MX")),
      trackingCopy.hint.timelineActor("Ana Dispatcher"),
    ]);
  });

  it("falls back to trip falseTripDeclaredBy when the event has no capturedBy", () => {
    expect(
      getFalseTripDeclaredTimelineMeta(
        event({
          eventType: "false_trip_declared",
          notes: "Sin carga",
          capturedBy: null,
          capturedByName: null,
        }),
        "Luis Operador",
      ),
    ).toEqual([
      trackingCopy.hint.timelineCause("Sin carga"),
      trackingCopy.hint.timelineActor("Luis Operador"),
    ]);
  });

  it("does not show raw UUID as timeline actor", () => {
    expect(
      getFalseTripDeclaredTimelineMeta(
        event({
          eventType: "false_trip_declared",
          notes: "Sin carga",
          capturedBy: "66d10682-f191-4a6d-91a4-268de3fa0558",
          capturedByName: null,
        }),
      ),
    ).toEqual([trackingCopy.hint.timelineCause("Sin carga")]);
  });

  it("F4d-c: return_planned title + meta Bitácora R10", () => {
    const planned = event({
      eventType: "return_planned",
      capturedByName: "Ana Dispatcher",
      payload: {
        cargo_id: "11111111-1111-4111-8111-111111111111",
        destination_label: "CEDIS Monterrey",
        timing: "before_continuing",
        estimated_extra_km: 42,
      },
    });
    expect(getReturnPlannedTimelineTitle(planned)).toBe(
      trackingCopy.planReturn.bitacora(
        "CEDIS Monterrey",
        trackingCopy.planReturn.bitacoraWhenBefore,
      ),
    );
    expect(getReturnPlannedTimelineMeta(planned)).toEqual([
      trackingCopy.planReturn.bitacoraMeta("42", "Ana Dispatcher"),
    ]);
  });

  it("F4d-c: return_planned as_new_destination usa «al final del recorrido»", () => {
    expect(
      getReturnPlannedTimelineTitle(
        event({
          eventType: "return_planned",
          payload: {
            destination_label: "Bodega León",
            timing: "as_new_destination",
          },
        }),
      ),
    ).toBe(
      trackingCopy.planReturn.bitacora(
        "Bodega León",
        trackingCopy.planReturn.bitacoraWhenAtEnd,
      ),
    );
  });
});
