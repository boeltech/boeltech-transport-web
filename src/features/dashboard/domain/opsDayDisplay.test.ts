import { describe, expect, it } from "vitest";

import {
  buildOpsDayAllHref,
  buildOpsDayBucketHref,
  formatOpsDayDelaySubtext,
  opsDayApproximateTotal,
  resolveOpsDayRowBucket,
} from "./opsDayDisplay";
import type { TripOpsDayItem } from "@features/trips/domain";

const baseItem: TripOpsDayItem = {
  id: "1",
  tripCode: "V-1",
  originCity: "Qro",
  destinationCity: "CDMX",
  status: "scheduled",
  scheduledDeparture: "2026-11-17T17:00:00.000Z",
  scheduledArrival: null,
  actualDeparture: null,
  actualArrival: null,
  delayKind: null,
  delayMs: null,
  driverFullName: null,
  vehicleUnitNumber: null,
};

describe("opsDayDisplay", () => {
  it("formatOpsDayDelaySubtext D33", () => {
    expect(formatOpsDayDelaySubtext("departure", 0)).toBe(
      "salida · no ha salido",
    );
    expect(formatOpsDayDelaySubtext("arrival", 30 * 60_000)).toBe(
      "llegada · <1 h tarde",
    );
    expect(formatOpsDayDelaySubtext("arrival", 2 * 3_600_000)).toBe(
      "llegada · 2 h tarde",
    );
  });

  it("resolveOpsDayRowBucket prioriza retraso", () => {
    expect(
      resolveOpsDayRowBucket({
        ...baseItem,
        status: "in_progress",
        delayKind: "arrival",
        delayMs: 3_600_000,
      }),
    ).toBe("overdue");
    expect(resolveOpsDayRowBucket(baseItem)).toBe("departing");
  });

  it("hrefs de franja y total aproximado", () => {
    expect(buildOpsDayAllHref("2026-11-17")).toBe("/trips?opsDay=2026-11-17");
    expect(buildOpsDayBucketHref("overdue", "2026-11-17")).toBe(
      "/trips?overdue=1",
    );
    expect(opsDayApproximateTotal({ departing: 5, inProgress: 7, overdue: 2, arrived: 3 })).toBe(
      15,
    );
  });
});
