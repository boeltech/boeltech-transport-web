import { describe, expect, it } from "vitest";

import { TripStatus, type Trip } from "@features/trips/domain";

import { isFleetAssignmentCpRelevantChange } from "./isFleetAssignmentCpRelevantChange";
import type { TripFleetAssignmentFormValues } from "./fleetAssignmentValidation";

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: "trip-1",
    status: TripStatus.SCHEDULED,
    vehicleId: "veh-1",
    driverId: "drv-1",
    vehicle: { id: "veh-1", unitNumber: "U-1", licensePlate: "AAA-111" },
    driver: { id: "drv-1", fullName: "Conductor" },
    trailers: [],
    internalStaff: [],
    ...overrides,
  } as Trip;
}

function baseValues(
  overrides: Partial<TripFleetAssignmentFormValues> = {},
): TripFleetAssignmentFormValues {
  return {
    vehicleId: "veh-1",
    driverId: "drv-1",
    trailers: [],
    internalStaff: [],
    allowExpiredDocs: false,
    ...overrides,
  };
}

describe("isFleetAssignmentCpRelevantChange", () => {
  it("returns false for no-op (same vehicle/driver/trailers)", () => {
    expect(
      isFleetAssignmentCpRelevantChange(makeTrip(), baseValues()),
    ).toBe(false);
  });

  it("returns false when only internalStaff differs", () => {
    expect(
      isFleetAssignmentCpRelevantChange(
        makeTrip(),
        baseValues({
          internalStaff: [
            {
              employeeId: "emp-1",
              internalRole: "helper",
              isPaymentResponsible: false,
              paymentNotes: "",
            },
          ],
        }),
      ),
    ).toBe(false);
  });

  it("returns false when only allowExpiredDocs differs", () => {
    expect(
      isFleetAssignmentCpRelevantChange(
        makeTrip(),
        baseValues({ allowExpiredDocs: true }),
      ),
    ).toBe(false);
  });

  it("returns true when vehicleId changes", () => {
    expect(
      isFleetAssignmentCpRelevantChange(
        makeTrip(),
        baseValues({ vehicleId: "veh-2" }),
      ),
    ).toBe(true);
  });

  it("returns true when driverId changes", () => {
    expect(
      isFleetAssignmentCpRelevantChange(
        makeTrip(),
        baseValues({ driverId: "drv-2" }),
      ),
    ).toBe(true);
  });

  it("returns true when trailers change", () => {
    expect(
      isFleetAssignmentCpRelevantChange(
        makeTrip({ trailers: [] }),
        baseValues({
          trailers: [{ trailerId: "trl-1", position: 1 }],
        }),
      ),
    ).toBe(true);
  });

  it("returns true when trailer position changes for same id", () => {
    expect(
      isFleetAssignmentCpRelevantChange(
        makeTrip({
          trailers: [{ trailerId: "trl-1", position: 1 } as never],
        }),
        baseValues({
          trailers: [{ trailerId: "trl-1", position: 2 }],
        }),
      ),
    ).toBe(true);
  });

  it("returns false when trailers match regardless of array order", () => {
    const trip = makeTrip({
      trailers: [
        { trailerId: "trl-2", position: 2 },
        { trailerId: "trl-1", position: 1 },
      ] as never,
    });
    expect(
      isFleetAssignmentCpRelevantChange(
        trip,
        baseValues({
          trailers: [
            { trailerId: "trl-1", position: 1 },
            { trailerId: "trl-2", position: 2 },
          ],
        }),
      ),
    ).toBe(false);
  });
});
