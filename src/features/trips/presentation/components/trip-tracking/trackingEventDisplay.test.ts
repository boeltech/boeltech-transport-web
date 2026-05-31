import { describe, expect, it } from "vitest";

import type { TrackingEvent } from "@features/trips/domain";

import {
  getTrackingEventTimelineBody,
  getTrackingIncidentTimelineMeta,
} from "./trackingEventDisplay";

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
});
