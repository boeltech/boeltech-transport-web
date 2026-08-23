import { describe, expect, it } from "vitest";

import {
  evaluateFederalCategoryForVehicleType,
  getDriverLicenseAssignmentSoftSignal,
  getDriverLicenseCategorySoftWarning,
} from "./licenseVehicleMatch";

describe("evaluateFederalCategoryForVehicleType (web)", () => {
  it("soft-warns C on truck", () => {
    const result = evaluateFederalCategoryForVehicleType("C", "truck");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe("category_mismatch");
    }
  });

  it("accepts C on torton", () => {
    expect(evaluateFederalCategoryForVehicleType("C", "torton").ok).toBe(true);
  });

  it("warns missing federal when required", () => {
    const result = evaluateFederalCategoryForVehicleType(null, "truck", {
      requireFederalForTrip: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe("missing_federal");
      expect(result.code).toBe("LICENSE_FEDERAL_MISSING");
    }
  });
});

describe("getDriverLicenseAssignmentSoftSignal", () => {
  it("returns category_mismatch for truck + C", () => {
    expect(
      getDriverLicenseAssignmentSoftSignal(
        { federalLicenseCategory: "C" },
        "truck",
      ),
    ).toMatchObject({ kind: "category_mismatch" });
  });

  it("returns missing_federal when category null", () => {
    expect(
      getDriverLicenseAssignmentSoftSignal(
        { federalLicenseCategory: null },
        "truck",
      ),
    ).toMatchObject({ kind: "missing_federal" });
  });

  it("returns undefined for torton + C", () => {
    expect(
      getDriverLicenseAssignmentSoftSignal(
        { federalLicenseCategory: "C" },
        "torton",
      ),
    ).toBeUndefined();
  });
});

describe("getDriverLicenseCategorySoftWarning", () => {
  it("returns message for truck + C", () => {
    expect(
      getDriverLicenseCategorySoftWarning(
        { federalLicenseCategory: "C" },
        "truck",
      ),
    ).toMatch(/SICT C/);
  });

  it("returns undefined for torton + C", () => {
    expect(
      getDriverLicenseCategorySoftWarning(
        { federalLicenseCategory: "C" },
        "torton",
      ),
    ).toBeUndefined();
  });

  it("returns undefined without vehicle type", () => {
    expect(
      getDriverLicenseCategorySoftWarning(
        { federalLicenseCategory: "C" },
        null,
      ),
    ).toBeUndefined();
  });
});
