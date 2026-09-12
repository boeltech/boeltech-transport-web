import { describe, expect, it } from "vitest";
import { mapBackendError } from "./errorMapper";

describe("errorMapper vehicle delete / inactive codes", () => {
  it("maps VEHICLE_ASSIGNED_TO_ACTIVE_TRIP from plain object", () => {
    const mapped = mapBackendError({
      code: "VEHICLE_ASSIGNED_TO_ACTIVE_TRIP",
    });

    expect(mapped.code).toBe("VEHICLE_ASSIGNED_TO_ACTIVE_TRIP");
    expect(mapped.message).toContain("viajes activos");
    expect(mapped.message).toContain("Reasigne");
  });

  it("maps VEHICLE_INACTIVE with actionable reassignment copy", () => {
    const mapped = mapBackendError({
      code: "VEHICLE_INACTIVE",
    });

    expect(mapped.code).toBe("VEHICLE_INACTIVE");
    expect(mapped.message).toContain("dada de baja");
    expect(mapped.message).toContain("Reasigne la flota");
  });
});
