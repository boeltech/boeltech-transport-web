import { describe, expect, it } from "vitest";

import { resolveFalseTripDeclaration } from "./resolveFalseTripDeclaration";

describe("resolveFalseTripDeclaration", () => {
  it("prioriza evento timeline false_trip_declared (notes + capturedBy + occurredAt)", () => {
    const result = resolveFalseTripDeclaration({
      trip: {
        falseTripDeclaredAt: new Date("2026-11-10T12:00:00Z"),
        falseTripDeclaredBy: "Fallback Name",
      },
      events: [
        {
          eventType: "note",
          notes: "ignorado",
          capturedBy: "Otro",
          occurredAt: new Date("2026-11-13T15:00:00Z"),
        },
        {
          eventType: "false_trip_declared",
          notes: "  Cliente canceló en origen  ",
          capturedBy: "Rosa Alcántara",
          occurredAt: new Date("2026-11-13T15:40:00Z"),
        },
      ],
    });

    expect(result).toEqual({
      declaredBy: "Rosa Alcántara",
      declaredAt: new Date("2026-11-13T15:40:00Z"),
      reason: "Cliente canceló en origen",
    });
  });

  it("usa el evento más reciente si hay varios false_trip_declared", () => {
    const result = resolveFalseTripDeclaration({
      trip: {
        falseTripDeclaredAt: null,
        falseTripDeclaredBy: null,
      },
      events: [
        {
          eventType: "false_trip_declared",
          notes: "viejo",
          capturedBy: "Ana",
          occurredAt: new Date("2026-11-01T10:00:00Z"),
        },
        {
          eventType: "false_trip_declared",
          notes: "nuevo",
          capturedBy: "Luis",
          occurredAt: new Date("2026-11-12T10:00:00Z"),
        },
      ],
    });

    expect(result.declaredBy).toBe("Luis");
    expect(result.reason).toBe("nuevo");
  });

  it("cae a trip.falseTripDeclared* si no hay evento; motivo queda null", () => {
    const at = new Date("2026-11-18T18:40:00Z");
    const result = resolveFalseTripDeclaration({
      trip: {
        falseTripDeclaredAt: at,
        falseTripDeclaredBy: "Ana Dispatcher",
      },
      events: [],
    });

    expect(result).toEqual({
      declaredBy: "Ana Dispatcher",
      declaredAt: at,
      reason: null,
    });
  });

  it("si el evento no trae capturedBy, usa falseTripDeclaredBy del trip", () => {
    const result = resolveFalseTripDeclaration({
      trip: {
        falseTripDeclaredAt: new Date("2026-11-18T18:40:00Z"),
        falseTripDeclaredBy: "Ana Dispatcher",
      },
      events: [
        {
          eventType: "false_trip_declared",
          notes: "Motivo del sheet",
          capturedBy: null,
          occurredAt: new Date("2026-11-18T18:40:00Z"),
        },
      ],
    });

    expect(result.declaredBy).toBe("Ana Dispatcher");
    expect(result.reason).toBe("Motivo del sheet");
  });
});
