import { describe, expect, it } from "vitest";

import { TripStatus, type Trip } from "@features/trips/domain";

import {
  buildScheduleComparisonRows,
  buildScheduleFooterText,
  formatScheduleDifference,
} from "./buildScheduleComparisonRows";

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: "t1",
    status: TripStatus.IN_PROGRESS,
    scheduledDeparture: new Date("2026-05-28T12:00:00.000Z"),
    scheduledArrival: new Date("2026-05-28T20:00:00.000Z"),
    actualDeparture: new Date("2026-05-28T12:05:00.000Z"),
    actualArrival: null,
    mileage: { start: 72315, end: null },
    totalDistRec: 352,
    ...overrides,
  } as Trip;
}

describe("buildScheduleComparisonRows", () => {
  it("arma filas Salida/Llegada con diferencia y odómetro", () => {
    const rows = buildScheduleComparisonRows(makeTrip());
    expect(rows).toHaveLength(2);
    expect(rows[0].id).toBe("departure");
    expect(rows[0].difference).toMatch(/5 min después/);
    expect(rows[0].mileageKm).toBe("72,315");
    expect(rows[1].id).toBe("arrival");
    expect(rows[1].actual).toBe("—");
    expect(rows[1].mileageKm).toBe("—");
  });

  it("formatScheduleDifference: a tiempo / antes / vacío", () => {
    const base = new Date("2026-05-28T12:00:00.000Z");
    expect(formatScheduleDifference(base, base)).toBe("A tiempo");
    expect(
      formatScheduleDifference(base, new Date("2026-05-28T11:50:00.000Z")),
    ).toMatch(/antes/);
    expect(formatScheduleDifference(base, null)).toBe("—");
  });

  it("footer con recorrido real, planeado y duración cuando hay cierre", () => {
    const footer = buildScheduleFooterText(
      makeTrip({
        actualArrival: new Date("2026-05-28T20:20:00.000Z"),
        mileage: { start: 1000, end: 1358 },
      }),
    );
    expect(footer).toMatch(/Recorrido real 358 km/);
    expect(footer).toMatch(/Planeado 352 km/);
    expect(footer).toMatch(/Duración/);
  });
});
