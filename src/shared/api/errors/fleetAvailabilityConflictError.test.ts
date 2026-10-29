import { describe, expect, it } from "vitest";

import { ApiError } from "@shared/api/interceptors/error-handler";
import {
  FLEET_AVAILABILITY_CONFLICT_CODE,
  isFleetAvailabilityConflictError,
  parseFleetAvailabilityConflicts,
} from "./fleetAvailabilityConflictError";

describe("parseFleetAvailabilityConflicts", () => {
  it("returns null for unrelated errors", () => {
    expect(parseFleetAvailabilityConflicts(new Error("x"))).toBeNull();
    expect(
      parseFleetAvailabilityConflicts(
        new ApiError("Otro", 400, "VALIDATION_ERROR"),
      ),
    ).toBeNull();
    expect(isFleetAvailabilityConflictError(new Error("x"))).toBe(false);
  });

  it("parses collect-all conflicts from ApiError details (snake_case)", () => {
    const error = new ApiError(
      "Hay 2 conflictos de disponibilidad de flota. Reasigna o cambia fechas.",
      400,
      FLEET_AVAILABILITY_CONFLICT_CODE,
      {
        conflicts: [
          {
            resource_type: "vehicle",
            resource_id: "veh-1",
            display_label: "UNI-01",
            conflicting_trip_id: "trip-peer",
            conflicting_trip_code: "TR-PEER",
            conflict_kind: "fleet_overlap",
          },
          {
            resource_type: "internal_staff",
            resource_id: "emp-1",
            display_label: "Ana López",
            role: "helper",
            conflicting_trip_code: "TR-2",
            conflict_kind: "staff_on_peer_primary",
          },
        ],
      },
    );

    const conflicts = parseFleetAvailabilityConflicts(error);
    expect(conflicts).toEqual([
      {
        resourceType: "vehicle",
        resourceId: "veh-1",
        displayLabel: "UNI-01",
        conflictingTripId: "trip-peer",
        conflictingTripCode: "TR-PEER",
        conflictKind: "fleet_overlap",
      },
      {
        resourceType: "internal_staff",
        resourceId: "emp-1",
        displayLabel: "Ana López",
        role: "helper",
        conflictingTripCode: "TR-2",
        conflictKind: "staff_on_peer_primary",
      },
    ]);
    expect(isFleetAvailabilityConflictError(error)).toBe(true);
  });

  it("parses duck-typed TripActionError with details", () => {
    const error = Object.assign(new Error("Hay 1 conflicto"), {
      code: FLEET_AVAILABILITY_CONFLICT_CODE,
      details: {
        conflicts: [
          {
            resource_type: "driver",
            resource_id: "drv-1",
            display_label: "Juan Pérez",
            conflicting_trip_code: "TR-9",
            conflict_kind: "fleet_overlap",
          },
        ],
      },
    });

    expect(parseFleetAvailabilityConflicts(error)).toEqual([
      {
        resourceType: "driver",
        resourceId: "drv-1",
        displayLabel: "Juan Pérez",
        conflictingTripCode: "TR-9",
        conflictKind: "fleet_overlap",
      },
    ]);
  });

  it("returns empty array when code matches but conflicts missing", () => {
    const error = new ApiError(
      "Hay conflictos",
      400,
      FLEET_AVAILABILITY_CONFLICT_CODE,
      {},
    );
    expect(parseFleetAvailabilityConflicts(error)).toEqual([]);
  });

  it("skips malformed conflict entries", () => {
    const error = new ApiError("x", 400, FLEET_AVAILABILITY_CONFLICT_CODE, {
      conflicts: [
        { resource_type: "vehicle" },
        {
          resource_type: "trailer",
          resource_id: "trl-1",
          display_label: "REM-1",
          conflicting_trip_code: "TR-3",
          conflict_kind: "fleet_overlap",
        },
      ],
    });
    expect(parseFleetAvailabilityConflicts(error)).toHaveLength(1);
  });
});
