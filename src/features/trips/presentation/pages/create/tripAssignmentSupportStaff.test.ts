import { describe, expect, it } from "vitest";

import type { EmployeeListItem } from "@features/employees";
import type { DriverListItem } from "@features/drivers/domain";

import { BUSY_ON_ACTIVE_TRIP } from "./tripAssignmentBusyResources";
import {
  buildAssignableSupportStaffForTripWizard,
  findSupportStaffAssignability,
} from "./tripAssignmentSupportStaff";

function employee(
  overrides: Partial<EmployeeListItem> & Pick<EmployeeListItem, "id" | "fullName">,
): EmployeeListItem {
  return {
    employeeNumber: "E-001",
    firstName: "Juan",
    lastName: "Pérez",
    secondLastName: null,
    gender: null,
    department: null,
    position: "Conductor",
    employmentType: "permanent",
    hireDate: "2024-01-01",
    status: "active",
    isActive: true,
    email: null,
    phone: null,
    ...overrides,
  };
}

function driver(
  overrides: Partial<DriverListItem> & Pick<DriverListItem, "id" | "employeeId">,
): DriverListItem {
  return {
    licenseNumber: "LIC-1",
    licenseType: "C",
    licenseExpiry: new Date("2027-01-01"),
    licenseState: "JAL",
    status: "available",
    isActive: true,
    isLicenseExpired: false,
    employee: {
      id: overrides.employeeId,
      employeeNumber: "E-001",
      firstName: "Juan",
      lastName: "Pérez",
      secondLastName: null,
      fullName: "Juan Pérez",
    },
    ...overrides,
  } as DriverListItem;
}

const emptyBusy = {
  vehicleIds: new Set<string>(),
  driverIds: new Set<string>(),
  employeeIds: new Set<string>(),
};

describe("buildAssignableSupportStaffForTripWizard", () => {
  it("blocks employee assigned as support staff on another active trip", () => {
    const emp = employee({
      id: "emp-1",
      fullName: "Apoyo Ocupado",
      position: "Ayudante general",
    });
    const result = buildAssignableSupportStaffForTripWizard({
      employees: [emp],
      driversByEmployeeId: new Map(),
      busyResources: {
        ...emptyBusy,
        employeeIds: new Set(["emp-1"]),
      },
      positionFilter: "Ayudante general",
      excludeEmployeeIds: new Set(),
    });

    expect(result[0]).toMatchObject({
      canBeAssigned: false,
      blockReason: BUSY_ON_ACTIVE_TRIP,
      internalRole: "helper",
    });
  });

  it("blocks conductor on_trip via driver profile", () => {
    const emp = employee({ id: "emp-2", fullName: "Conductor En Viaje" });
    const driversByEmployeeId = new Map([
      ["emp-2", driver({ id: "drv-2", employeeId: "emp-2", status: "on_trip" })],
    ]);

    const result = buildAssignableSupportStaffForTripWizard({
      employees: [emp],
      driversByEmployeeId,
      busyResources: emptyBusy,
      positionFilter: "Conductor",
      excludeEmployeeIds: new Set(),
    });

    expect(result[0]).toMatchObject({
      canBeAssigned: false,
      blockReason: "En viaje",
      internalRole: "secondary_driver",
    });
  });

  it("blocks conductor who is primary driver on another active trip", () => {
    const emp = employee({ id: "emp-3", fullName: "Conductor Principal Ocupado" });
    const driversByEmployeeId = new Map([
      ["emp-3", driver({ id: "drv-3", employeeId: "emp-3" })],
    ]);

    const result = buildAssignableSupportStaffForTripWizard({
      employees: [emp],
      driversByEmployeeId,
      busyResources: {
        ...emptyBusy,
        driverIds: new Set(["drv-3"]),
      },
      positionFilter: "Conductor",
      excludeEmployeeIds: new Set(),
    });

    expect(result[0]).toMatchObject({
      canBeAssigned: false,
      blockReason: BUSY_ON_ACTIVE_TRIP,
    });
  });

  it("allows free helper without driver profile", () => {
    const emp = employee({
      id: "emp-4",
      fullName: "Ayudante Libre",
      position: "Ayudante general",
    });

    const result = buildAssignableSupportStaffForTripWizard({
      employees: [emp],
      driversByEmployeeId: new Map(),
      busyResources: emptyBusy,
      positionFilter: "Ayudante general",
      excludeEmployeeIds: new Set(),
    });

    expect(result[0]).toMatchObject({
      canBeAssigned: true,
      internalRole: "helper",
    });
  });

  it("blocks conductor filter without driver profile", () => {
    const emp = employee({ id: "emp-5", fullName: "Sin Perfil" });

    const result = buildAssignableSupportStaffForTripWizard({
      employees: [emp],
      driversByEmployeeId: new Map(),
      busyResources: emptyBusy,
      positionFilter: "Conductor",
      excludeEmployeeIds: new Set(),
    });

    expect(result[0]).toMatchObject({
      canBeAssigned: false,
      blockReason: "Sin perfil de conductor activo",
    });
  });
});

describe("findSupportStaffAssignability", () => {
  it("ignores self when validating existing row in edit mode", () => {
    const emp = employee({
      id: "emp-edit",
      fullName: "Ya En Este Viaje",
      position: "Ayudante general",
    });

    const item = findSupportStaffAssignability("emp-edit", {
      employees: [emp],
      driversByEmployeeId: new Map(),
      busyResources: {
        ...emptyBusy,
        employeeIds: new Set(["emp-edit"]),
      },
      excludeEmployeeIds: new Set(["emp-edit"]),
    });

    expect(item?.canBeAssigned).toBe(true);
  });
});
