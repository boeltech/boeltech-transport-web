import { describe, expect, it } from "vitest";

import { mapFleetAvailability } from "./mappers";

describe("mapFleetAvailability", () => {
  it("mapea snake_case API a camelCase", () => {
    const data = mapFleetAvailability({
      vehicles: {
        total_active: 18,
        free: 4,
        on_trip: 11,
        in_maintenance: 2,
        out_of_service: 1,
      },
      drivers: {
        total_active: 22,
        free: 5,
        on_trip: 13,
        resting: 4,
      },
    });

    expect(data.vehicles).toEqual({
      totalActive: 18,
      free: 4,
      onTrip: 11,
      inMaintenance: 2,
      outOfService: 1,
    });
    expect(data.drivers.resting).toBe(4);
  });
});
