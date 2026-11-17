import { describe, expect, it } from "vitest";
import { mapBackendError } from "./errorMapper";

describe("errorMapper fleet odometer (política B)", () => {
  it("maps FLEET_INCOMING_ODOMETER_REQUIRED", () => {
    const mapped = mapBackendError({
      code: "FLEET_INCOMING_ODOMETER_REQUIRED",
    });

    expect(mapped.code).toBe("FLEET_INCOMING_ODOMETER_REQUIRED");
    expect(mapped.message).toMatch(/odómetro/i);
    expect(mapped.message).toMatch(/unidad que asignas/i);
  });

  it("maps FLEET_ODOMETER_WITHOUT_VEHICLE_CHANGE", () => {
    const mapped = mapBackendError({
      code: "FLEET_ODOMETER_WITHOUT_VEHICLE_CHANGE",
    });

    expect(mapped.code).toBe("FLEET_ODOMETER_WITHOUT_VEHICLE_CHANGE");
    expect(mapped.message).toMatch(/cambiar la unidad/i);
  });
});
