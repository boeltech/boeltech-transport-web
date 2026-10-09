import { afterEach, describe, expect, it, vi } from "vitest";
import { getAssignmentDisplayStatus } from "./getAssignmentDisplayStatus";

const TODAY = "2026-10-08";

function assignment(effectiveFrom: string, effectiveTo: string | null, isActive = true) {
  return { effectiveFrom, effectiveTo, isActive };
}

describe("getAssignmentDisplayStatus (api#63 C10)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ["fin = hoy → Vigente", assignment("2026-09-01", "2026-10-08"), "current"],
    ["desde = hoy → Vigente", assignment("2026-10-08", null), "current"],
    ["abierta que ya empezó → Vigente", assignment("2026-01-01", null), "current"],
    ["desde = mañana → Programada", assignment("2026-10-09", null), "scheduled"],
    ["fin = ayer → Concluida", assignment("2026-09-01", "2026-10-07"), "concluded"],
    ["caso Fernando (01 sep–06 oct) el 08 oct → Concluida", assignment("2026-09-01", "2026-10-06"), "concluded"],
    ["inactiva futura → Desactivada", assignment("2026-11-01", null, false), "deactivated"],
    ["inactiva concluida → Desactivada", assignment("2026-01-01", "2026-02-01", false), "deactivated"],
    ["inactiva vigente → Desactivada", assignment("2026-01-01", null, false), "deactivated"],
  ])("%s", (_label, input, expected) => {
    expect(getAssignmentDisplayStatus(input, TODAY)).toBe(expected);
  });

  it("acepta fechas con hora sin cambiar el día", () => {
    expect(
      getAssignmentDisplayStatus(assignment("2026-09-01T00:00:00.000Z", "2026-10-08T00:00:00.000Z"), TODAY),
    ).toBe("current");
  });

  it("sin `today` usa el día de México, no el de UTC", () => {
    vi.useFakeTimers();
    // 9 oct 02:00 UTC = 8 oct 20:00 en CDMX.
    vi.setSystemTime(new Date("2026-10-09T02:00:00.000Z"));
    expect(getAssignmentDisplayStatus(assignment("2026-09-01", "2026-10-08"))).toBe("current");
    expect(getAssignmentDisplayStatus(assignment("2026-10-09", null))).toBe("scheduled");
  });
});
