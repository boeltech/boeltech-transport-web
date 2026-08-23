import { describe, expect, it } from "vitest";
import { LICENSE_TYPE_LABELS } from "./entities";
import {
  getDriverLicenseJurisdiction,
  getDriverPrimaryCategoryLabel,
  getDriverPrimaryLicenseExpiry,
  getDriverPrimaryLicenseNumber,
} from "./licenseDisplay";

describe("licenseDisplay helpers", () => {
  it("prefers federal license number and expiry over state", () => {
    const driver = {
      federalLicenseNumber: "FED-1",
      stateLicenseNumber: "ST-1",
      federalLicenseExpiry: "2030-01-01",
      stateLicenseExpiry: "2029-01-01",
      federalLicenseCategory: "E" as const,
    };

    expect(getDriverPrimaryLicenseNumber(driver)).toBe("FED-1");
    expect(getDriverPrimaryLicenseExpiry(driver)).toBe("2030-01-01");
    expect(getDriverPrimaryCategoryLabel(driver, LICENSE_TYPE_LABELS)).toBe(
      LICENSE_TYPE_LABELS.E,
    );
    expect(getDriverLicenseJurisdiction(driver)).toBe("both");
  });

  it("falls back to state when federal is empty", () => {
    const driver = {
      federalLicenseNumber: null,
      stateLicenseNumber: "ST-2",
      federalLicenseExpiry: null,
      stateLicenseExpiry: "2028-06-01",
      federalLicenseCategory: null,
    };

    expect(getDriverPrimaryLicenseNumber(driver)).toBe("ST-2");
    expect(getDriverPrimaryLicenseExpiry(driver)).toBe("2028-06-01");
    expect(getDriverPrimaryCategoryLabel(driver, LICENSE_TYPE_LABELS)).toBe("");
    expect(getDriverLicenseJurisdiction(driver)).toBe("state");
  });

  it("uses hasFederalLicense / hasStateLicense flags when present", () => {
    expect(
      getDriverLicenseJurisdiction({
        hasFederalLicense: true,
        hasStateLicense: false,
        federalLicenseNumber: null,
        stateLicenseNumber: null,
      }),
    ).toBe("federal");
  });
});
