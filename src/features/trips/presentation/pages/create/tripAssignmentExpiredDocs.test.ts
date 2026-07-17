import { describe, expect, it } from "vitest";

import {
  buildTripAssignmentContext,
  deriveAllowExpiredDocs,
} from "./tripAssignmentExpiredDocs";

describe("deriveAllowExpiredDocs", () => {
  it("returns true when vehicle insurance is expired", () => {
    expect(
      deriveAllowExpiredDocs(
        { insuranceExpiry: "2020-01-01", sctPermitExpiry: "2030-01-01" },
        { isLicenseExpired: false },
      ),
    ).toBe(true);
  });

  it("returns true when driver license is expired", () => {
    expect(
      deriveAllowExpiredDocs(
        { insuranceExpiry: "2030-01-01", sctPermitExpiry: "2030-01-01" },
        { isLicenseExpired: true },
      ),
    ).toBe(true);
  });

  it("returns false when both are valid", () => {
    expect(
      deriveAllowExpiredDocs(
        { insuranceExpiry: "2030-01-01", sctPermitExpiry: "2030-01-01" },
        { isLicenseExpired: false },
      ),
    ).toBe(false);
  });
});

describe("buildTripAssignmentContext", () => {
  it("resolves selected vehicle and driver for payload derivation", () => {
    const context = buildTripAssignmentContext(
      { vehicleId: "veh-1", driverId: "drv-1" },
      [
        {
          id: "veh-1",
          insuranceExpiry: "2020-01-01",
          sctPermitExpiry: "2030-01-01",
        },
      ],
      [{ id: "drv-1", isLicenseExpired: false }],
    );

    expect(context.vehicle?.insuranceExpiry).toBe("2020-01-01");
    expect(context.driver?.isLicenseExpired).toBe(false);
  });
});
