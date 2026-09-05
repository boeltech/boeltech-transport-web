import { describe, expect, it } from "vitest";

import { tripFleetAssignmentSchema } from "./fleetAssignmentValidation";

describe("tripFleetAssignmentSchema", () => {
  it("rejects S/R config (T3S2) without trailers", () => {
    const result = tripFleetAssignmentSchema.safeParse({
      vehicleId: "veh-1",
      driverId: "drv-1",
      trailers: [],
      satConfigAutotransporteCode: "T3S2",
      internalStaff: [],
      allowExpiredDocs: false,
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    const trailerIssue = result.error.issues.find(
      (issue) => issue.path[0] === "trailers",
    );
    expect(trailerIssue?.message).toMatch(/remolque/i);
  });

  it("accepts S/R config when at least one trailer is assigned", () => {
    const result = tripFleetAssignmentSchema.safeParse({
      vehicleId: "veh-1",
      driverId: "drv-1",
      trailers: [
        {
          trailerId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
          position: 1 as const,
        },
      ],
      satConfigAutotransporteCode: "T3S2",
      internalStaff: [],
      allowExpiredDocs: false,
    });

    expect(result.success).toBe(true);
  });

  it("does not require trailers when satConfig is empty (omit until synced)", () => {
    const result = tripFleetAssignmentSchema.safeParse({
      vehicleId: "veh-1",
      driverId: "drv-1",
      trailers: [],
      satConfigAutotransporteCode: "",
      internalStaff: [],
      allowExpiredDocs: false,
    });

    expect(result.success).toBe(true);
  });
});
