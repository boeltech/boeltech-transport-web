import { describe, expect, it } from "vitest";

import { resolveFalseTripDeclaration } from "./resolveFalseTripDeclaration";

describe("resolveFalseTripDeclaration", () => {
  it("prioriza evento timeline false_trip_declared (notes + capturedByName + occurredAt)", () => {
    const result = resolveFalseTripDeclaration({
      trip: {
        falseTripDeclaredAt: new Date("2026-11-10T12:00:00Z"),
        falseTripDeclaredBy: "fallback-id",
        falseTripDeclaredByName: "Fallback Name",
      },
      events: [
        {
          eventType: "note",
          notes: "ignorado",
          capturedBy: "otro-id",
          capturedByName: "Otro",
          occurredAt: new Date("2026-11-13T15:00:00Z"),
        },
        {
          eventType: "false_trip_declared",
          notes: "  Cliente canceló en origen  ",
          capturedBy: "66d10682-f191-4a6d-91a4-268de3fa0558",
          capturedByName: "Rosa Alcántara",
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
        falseTripDeclaredByName: null,
      },
      events: [
        {
          eventType: "false_trip_declared",
          notes: "viejo",
          capturedBy: "ana-id",
          capturedByName: "Ana",
          occurredAt: new Date("2026-11-01T10:00:00Z"),
        },
        {
          eventType: "false_trip_declared",
          notes: "nuevo",
          capturedBy: "luis-id",
          capturedByName: "Luis",
          occurredAt: new Date("2026-11-12T10:00:00Z"),
        },
      ],
    });

    expect(result.declaredBy).toBe("Luis");
    expect(result.reason).toBe("nuevo");
  });

  it("cae a trip.falseTripDeclaredByName si no hay evento; motivo queda null", () => {
    const at = new Date("2026-11-18T18:40:00Z");
    const result = resolveFalseTripDeclaration({
      trip: {
        falseTripDeclaredAt: at,
        falseTripDeclaredBy: "user-uuid",
        falseTripDeclaredByName: "Ana Dispatcher",
      },
      events: [],
    });

    expect(result).toEqual({
      declaredBy: "Ana Dispatcher",
      declaredAt: at,
      reason: null,
    });
  });

  it("si el evento no trae nombre, usa falseTripDeclaredByName del trip", () => {
    const result = resolveFalseTripDeclaration({
      trip: {
        falseTripDeclaredAt: new Date("2026-11-18T18:40:00Z"),
        falseTripDeclaredBy: "user-uuid",
        falseTripDeclaredByName: "Ana Dispatcher",
      },
      events: [
        {
          eventType: "false_trip_declared",
          notes: "Motivo del sheet",
          capturedBy: "66d10682-f191-4a6d-91a4-268de3fa0558",
          capturedByName: null,
          occurredAt: new Date("2026-11-18T18:40:00Z"),
        },
      ],
    });

    expect(result.declaredBy).toBe("Ana Dispatcher");
    expect(result.reason).toBe("Motivo del sheet");
  });

  it("no muestra UUID crudo cuando falta el nombre enriquecido", () => {
    const result = resolveFalseTripDeclaration({
      trip: {
        falseTripDeclaredAt: new Date("2026-11-18T18:40:00Z"),
        falseTripDeclaredBy: "66d10682-f191-4a6d-91a4-268de3fa0558",
        falseTripDeclaredByName: null,
      },
      events: [
        {
          eventType: "false_trip_declared",
          notes: "Rechazo en destino",
          capturedBy: "66d10682-f191-4a6d-91a4-268de3fa0558",
          capturedByName: null,
          occurredAt: new Date("2026-11-18T18:40:00Z"),
        },
      ],
    });

    expect(result.declaredBy).toBeNull();
  });
});
