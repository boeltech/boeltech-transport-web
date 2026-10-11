import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UserManagementEvent } from "../../domain";
import { groupUserActivityByDay } from "./userActivityGrouping";

function buildEvent(id: string, createdAt: string): UserManagementEvent {
  return {
    id,
    subjectUserId: "user-2",
    actorUserId: "user-1",
    actorEmail: "ana@tlama.mx",
    actorFirstName: "Ana",
    actorLastName: "Ruiz",
    action: "user_created",
    payload: {},
    createdAt,
  };
}

const TODAY = "2026-04-10";

describe("groupUserActivityByDay", () => {
  it("labels the current and previous day in words", () => {
    const groups = groupUserActivityByDay(
      [
        buildEvent("a", "2026-04-10T18:04:00.000Z"),
        buildEvent("b", "2026-04-09T15:00:00.000Z"),
        buildEvent("c", "2026-04-02T15:00:00.000Z"),
      ],
      TODAY,
    );

    expect(groups.map((group) => group.label)).toEqual([
      "Hoy",
      "Ayer",
      "02 abr 2026",
    ]);
  });

  it("keeps the API order and groups events of the same day together", () => {
    const groups = groupUserActivityByDay(
      [
        buildEvent("a", "2026-04-10T18:04:00.000Z"),
        buildEvent("b", "2026-04-10T14:00:00.000Z"),
        buildEvent("c", "2026-04-09T15:00:00.000Z"),
      ],
      TODAY,
    );

    expect(groups).toHaveLength(2);
    expect(groups[0].events.map((event) => event.id)).toEqual(["a", "b"]);
    expect(groups[1].events.map((event) => event.id)).toEqual(["c"]);
  });

  it("uses the Mexico civil day, not UTC", () => {
    // 2026-04-10T03:00Z sigue siendo 9 de abril por la noche en México.
    const groups = groupUserActivityByDay(
      [buildEvent("a", "2026-04-10T03:00:00.000Z")],
      TODAY,
    );

    expect(groups[0].label).toBe("Ayer");
  });

  it("collects events without a valid date under a single group", () => {
    const groups = groupUserActivityByDay([buildEvent("a", "")], TODAY);

    expect(groups[0].label).toBe("Sin fecha");
  });

  describe("default today (getTodayString)", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      // 2026-04-10 23:30 CDMX — en UTC ya es 11 de abril.
      vi.setSystemTime(new Date("2026-04-11T05:30:00.000Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("labels evening Mexico events as Hoy, not the UTC date", () => {
      const groups = groupUserActivityByDay([
        buildEvent("a", "2026-04-11T04:00:00.000Z"),
      ]);

      expect(groups[0].label).toBe("Hoy");
      expect(groups[0].key).toBe("2026-04-10");
    });
  });
});
