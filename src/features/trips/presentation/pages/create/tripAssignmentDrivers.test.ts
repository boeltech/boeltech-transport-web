import { describe, expect, it } from "vitest";

import type { DriverListItem } from "@features/drivers/domain";

import { buildAssignableDriversForTripWizard } from "./tripAssignmentDrivers";

function driver(
  overrides: Partial<DriverListItem> & Pick<DriverListItem, "id">,
): DriverListItem {
  return {
    tenantId: "tenant",
    employeeId: `emp-${overrides.id}`,
    employee: { id: `emp-${overrides.id}`, fullName: "Conductor" },
    licenseNumber: "LIC-1",
    licenseType: "E",
    licenseExpiry: "2030-01-01",
    status: "available",
    yearsOfExperience: 1,
    totalTrips: 0,
    isLicenseExpired: false,
    isActive: true,
    createdAt: new Date(),
    ...overrides,
  } as DriverListItem;
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

  it("shows on_trip drivers in the blocked group", () => {
    const result = buildAssignableDriversForTripWizard(
      [driver({ id: "drv-trip", status: "on_trip" })],
      new Set(),
    );

    expect(result[0]).toMatchObject({
      canBeAssigned: false,
      blockReason: "En viaje",
    });
    expect(result[0]?.expiredDocsOverridable).toBeUndefined();
  });

  it("marks expired license as overridable", () => {
    const result = buildAssignableDriversForTripWizard(
      [driver({ id: "drv-expired", isLicenseExpired: true })],
      new Set(),
    );

    expect(result[0]).toMatchObject({
      canBeAssigned: false,
      blockReason: "Licencia vencida",
      expiredDocsOverridable: true,
    });
  });
});
