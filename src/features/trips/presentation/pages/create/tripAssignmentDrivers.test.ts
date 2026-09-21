import { describe, expect, it } from "vitest";

import type { DriverListItem } from "@features/drivers/domain";

import { buildAssignableDriversForTripWizard } from "./tripAssignmentDrivers";

function baseDriverListItem(
  overrides: Partial<DriverListItem> & Pick<DriverListItem, "id">,
): DriverListItem {
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
    ...overrides,
  };
}

function driver(
  overrides: Partial<DriverListItem> & Pick<DriverListItem, "id">,
): DriverListItem {
  return baseDriverListItem(overrides);
}

describe("buildAssignableDriversForTripWizard", () => {
  it("marks available drivers on active trips as blocked with reason", () => {
    const result = buildAssignableDriversForTripWizard(
      [driver({ id: "drv-busy" }), driver({ id: "drv-free" })],
      new Set(["drv-busy"]),
    );

    expect(result.find((d) => d.id === "drv-busy")).toMatchObject({
      canBeAssigned: false,
      blockReason: "Asignado a un viaje activo",
    });
    expect(result.find((d) => d.id === "drv-free")?.canBeAssigned).toBe(true);
  });

  it("marks busy drivers as softBusy when softBusySelectable", () => {
    const conflict = {
      tripId: "t1",
      tripCode: "V-55",
      status: "scheduled" as const,
      scheduledDeparture: new Date("2026-06-03T08:00:00Z"),
    };
    const result = buildAssignableDriversForTripWizard(
      [driver({ id: "drv-busy" })],
      new Set(["drv-busy"]),
      {
        softBusySelectable: true,
        conflicts: new Map([["drv-busy", conflict]]),
      },
    );

    expect(result[0]).toMatchObject({
      canBeAssigned: true,
      softBusy: true,
      blockReason: "Reservado",
      assignmentConflict: conflict,
    });
  });

  it("shows on_trip drivers in the blocked group", () => {
    const result = buildAssignableDriversForTripWizard(
      [driver({ id: "drv-trip", status: "on_trip" })],
      new Set(),
    );

    expect(result[0]).toMatchObject({
      canBeAssigned: false,
      fleetHardBlocked: true,
      blockReason: "En Viaje",
    });
    expect(result[0]?.expiredDocsOverridable).toBeUndefined();
  });

  it("makes on_trip softBusy when softBusySelectable", () => {
    const result = buildAssignableDriversForTripWizard(
      [driver({ id: "drv-trip", status: "on_trip" })],
      new Set(),
      { softBusySelectable: true },
    );

    expect(result[0]).toMatchObject({
      canBeAssigned: true,
      softBusy: true,
      blockReason: "En Viaje",
    });
  });

  it("marks expired license as overridable", () => {
    const result = buildAssignableDriversForTripWizard(
      [driver({ id: "drv-expired", isLicenseExpired: true, isFederalLicenseExpired: true })],
      new Set(),
    );

    expect(result[0]).toMatchObject({
      canBeAssigned: false,
      blockReason: "Licencia vencida",
      expiredDocsOverridable: true,
    });
  });

  it("marks state-only expired license as overridable even when aggregate is false", () => {
    const result = buildAssignableDriversForTripWizard(
      [
        driver({
          id: "drv-state-only",
          federalLicenseNumber: null,
          federalLicenseCategory: null,
          federalLicenseExpiry: null,
          stateLicenseNumber: "EST-100000",
          stateLicenseExpiry: "2026-09-08",
          hasFederalLicense: false,
          hasStateLicense: true,
          isFederalLicenseExpired: false,
          isStateLicenseExpired: true,
          isLicenseExpired: false,
        }),
      ],
      new Set(),
    );

    expect(result[0]).toMatchObject({
      canBeAssigned: false,
      blockReason: "Licencia vencida",
      expiredDocsOverridable: true,
    });
  });

  it("keeps reserved driver assignable when it is the trip current assignment", () => {
    const result = buildAssignableDriversForTripWizard(
      [driver({ id: "drv-current", status: "reserved" })],
      new Set(),
      { keepAssignableDriverId: "drv-current" },
    );

    expect(result[0]).toMatchObject({
      canBeAssigned: true,
      blockReason: undefined,
    });
  });

  it("keeps other reserved drivers blocked", () => {
    const result = buildAssignableDriversForTripWizard(
      [
        driver({ id: "drv-current", status: "reserved" }),
        driver({ id: "drv-other", status: "reserved" }),
      ],
      new Set(),
      { keepAssignableDriverId: "drv-current" },
    );

    expect(result.find((d) => d.id === "drv-other")).toMatchObject({
      canBeAssigned: false,
      blockReason: "Reservado",
    });
  });

  it("keeps on_trip driver assignable when it is the trip current assignment", () => {
    const result = buildAssignableDriversForTripWizard(
      [driver({ id: "drv-current", status: "on_trip" })],
      new Set(),
      { keepAssignableDriverId: "drv-current" },
    );

    expect(result[0]).toMatchObject({
      canBeAssigned: true,
      blockReason: undefined,
    });
  });

  it("does not waive on_trip for a different driver", () => {
    const result = buildAssignableDriversForTripWizard(
      [driver({ id: "drv-other", status: "on_trip" })],
      new Set(),
      { keepAssignableDriverId: "drv-current" },
    );

    expect(result[0]).toMatchObject({
      canBeAssigned: false,
      fleetHardBlocked: true,
      blockReason: "En Viaje",
    });
  });

  it("does not promote reserved+expired license to softBusy when softBusySelectable", () => {
    const result = buildAssignableDriversForTripWizard(
      [
        driver({
          id: "drv-expired-reserved",
          status: "reserved",
          isLicenseExpired: true,
          isFederalLicenseExpired: true,
        }),
      ],
      new Set(),
      { softBusySelectable: true },
    );

    expect(result[0]).toMatchObject({
      canBeAssigned: false,
      expiredDocsOverridable: true,
      blockReason: "Licencia vencida",
    });
    expect(result[0]?.softBusy).toBeUndefined();
    expect(result[0]?.fleetHardBlocked).toBeUndefined();
  });

  it("hard-blocks on_trip+expired license when softBusySelectable is false", () => {
    const result = buildAssignableDriversForTripWizard(
      [
        driver({
          id: "drv-expired-on-trip",
          status: "on_trip",
          isLicenseExpired: true,
          isFederalLicenseExpired: true,
        }),
      ],
      new Set(),
      { softBusySelectable: false },
    );

    expect(result[0]).toMatchObject({
      canBeAssigned: false,
      fleetHardBlocked: true,
      blockReason: "En Viaje",
    });
  });

  it("hard-blocks reserved+expired license when softBusySelectable is false", () => {
    const result = buildAssignableDriversForTripWizard(
      [
        driver({
          id: "drv-expired-reserved",
          status: "reserved",
          isLicenseExpired: true,
          isFederalLicenseExpired: true,
        }),
      ],
      new Set(),
      { softBusySelectable: false },
    );

    expect(result[0]).toMatchObject({
      canBeAssigned: false,
      fleetHardBlocked: true,
      blockReason: "Reservado",
    });
  });
});
