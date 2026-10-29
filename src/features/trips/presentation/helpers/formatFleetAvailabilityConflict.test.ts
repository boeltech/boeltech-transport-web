import { describe, expect, it } from "vitest";

import type { FleetAvailabilityConflict } from "@shared/api/errors/fleetAvailabilityConflictError";
import {
  formatFleetAvailabilityConflictLine,
  formatFleetAvailabilityConflictToastDescription,
} from "./formatFleetAvailabilityConflict";

const base: FleetAvailabilityConflict = {
  resourceType: "vehicle",
  resourceId: "v1",
  displayLabel: "UNI-01",
  conflictingTripCode: "TR-1",
  conflictKind: "fleet_overlap",
};

describe("formatFleetAvailabilityConflictLine", () => {
  it("formats unit / trailer / operator lines", () => {
    expect(formatFleetAvailabilityConflictLine(base)).toBe(
      "Unidad · UNI-01 · TR-1",
    );
    expect(
      formatFleetAvailabilityConflictLine({
        ...base,
        resourceType: "trailer",
        displayLabel: "REM-9",
      }),
    ).toBe("Remolque · REM-9 · TR-1");
    expect(
      formatFleetAvailabilityConflictLine({
        ...base,
        resourceType: "driver",
        displayLabel: "Juan",
      }),
    ).toBe("Operador · Juan · TR-1");
  });

  it("includes staff role in type segment", () => {
    expect(
      formatFleetAvailabilityConflictLine({
        ...base,
        resourceType: "internal_staff",
        displayLabel: "Ana",
        role: "secondary_driver",
      }),
    ).toBe("Apoyo (2º conductor) · Ana · TR-1");
    expect(
      formatFleetAvailabilityConflictLine({
        ...base,
        resourceType: "internal_staff",
        displayLabel: "Luis",
        role: "helper",
      }),
    ).toBe("Apoyo (ayudante) · Luis · TR-1");
  });

  it("joins lines for toast description", () => {
    expect(
      formatFleetAvailabilityConflictToastDescription([
        base,
        {
          ...base,
          resourceType: "driver",
          resourceId: "d1",
          displayLabel: "Pedro",
          conflictingTripCode: "TR-2",
        },
      ]),
    ).toBe("Unidad · UNI-01 · TR-1\nOperador · Pedro · TR-2");
  });
});
