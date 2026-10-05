import { describe, expect, it } from "vitest";

import type { DriverListItem } from "@features/drivers/domain";
import type { AssignableVehicleItem } from "@features/vehicles/domain";

import {
  resolveSelectedAssignmentLicenseSoftSignal,
  resolveSelectedAssignmentLicenseSoftWarning,
} from "./tripAssignmentLicenseMatch";
import type { AssignableDriverItem } from "./tripAssignmentDrivers";

function driver(
  overrides: Partial<DriverListItem> & Pick<DriverListItem, "id">,
): AssignableDriverItem {
  return {
    tenantId: "tenant",
    employeeId: `emp-${overrides.id}`,
    employee: {
      id: `emp-${overrides.id}`,
      employeeNumber: "E-001",
      firstName: "Conductor",
      lastName: "Prueba",
      secondLastName: null,
      fullName: "Conductor",
      email: null,
      phone: null,
      mobilePhone: null,
      curp: null,
      rfc: null,
      branchId: null,
      branchName: null,
      branchCode: null,
    },
    federalLicenseNumber: "LIC-1",
    federalLicenseCategory: "E",
    federalLicenseExpiry: "2030-01-01",
    stateLicenseNumber: null,
    stateLicenseExpiry: null,
    stateIssuingState: null,
    hasFederalLicense: true,
    hasStateLicense: false,
    isFederalLicenseExpired: false,
    isStateLicenseExpired: false,
    status: "available",
    yearsOfExperience: 1,
    totalTrips: 0,
    isLicenseExpired: false,
    isActive: true,
    createdAt: new Date(),
    branchId: null,
    branchName: null,
    branchCode: null,
    canBeAssigned: true,
    displayName: "Conductor",
    ...overrides,
  };
}

function vehicle(
  overrides: Partial<AssignableVehicleItem> &
    Pick<AssignableVehicleItem, "id" | "type">,
): AssignableVehicleItem {
  return {
    tenantId: "tenant",
    unitNumber: "U-1",
    licensePlate: "ABC-1",
    brand: "Kenworth",
    model: "T680",
    year: 2022,
    status: "available",
    isActive: true,
    currentMileage: 0,
    insuranceExpiry: null,
    sctPermitExpiry: null,
    branchId: null,
    branchName: null,
    branchCode: null,
    canBeAssigned: true,
    ...overrides,
  } as AssignableVehicleItem;
}

describe("resolveSelectedAssignmentLicenseSoftWarning", () => {
  it("warns truck + category C without blocking", () => {
    const d = driver({ id: "d1", federalLicenseCategory: "C" });
    const v = vehicle({ id: "v1", type: "truck" });
    const warning = resolveSelectedAssignmentLicenseSoftWarning(d, v);
    expect(warning).toMatch(/SICT C/);
    expect(d.canBeAssigned).toBe(true);
  });

  it("no warning for torton + C", () => {
    expect(
      resolveSelectedAssignmentLicenseSoftWarning(
        driver({ id: "d1", federalLicenseCategory: "C" }),
        vehicle({ id: "v1", type: "torton" }),
      ),
    ).toBeUndefined();
  });

  it("warns when federal category missing for known vehicle type", () => {
    expect(
      resolveSelectedAssignmentLicenseSoftWarning(
        driver({
          id: "d1",
          federalLicenseCategory: null,
          hasFederalLicense: false,
        }),
        vehicle({ id: "v1", type: "truck" }),
      ),
    ).toMatch(/federal SICT/i);
  });

  it("distinguishes missing federal kind via soft signal", () => {
    expect(
      resolveSelectedAssignmentLicenseSoftSignal(
        driver({
          id: "d1",
          federalLicenseCategory: null,
          hasFederalLicense: false,
        }),
        vehicle({ id: "v1", type: "truck" }),
      )?.kind,
    ).toBe("missing_federal");
  });

  it("no warning without vehicle or driver", () => {
    expect(
      resolveSelectedAssignmentLicenseSoftWarning(
        undefined,
        vehicle({ id: "v1", type: "truck" }),
      ),
    ).toBeUndefined();
    expect(
      resolveSelectedAssignmentLicenseSoftWarning(
        driver({ id: "d1" }),
        undefined,
      ),
    ).toBeUndefined();
  });
});
