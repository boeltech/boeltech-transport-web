import { describe, expect, it } from "vitest";

import { TripStatus, type TripListItem } from "@features/trips/domain";
import type { AssignableVehicleItem } from "@features/vehicles/domain";

import {
  applyBusyResourcesToVehicles,
  buildBusyAssignmentResourceIds,
} from "./tripAssignmentBusyResources";

function trip(
  overrides: Partial<TripListItem> & Pick<TripListItem, "id" | "status">,
): TripListItem {
  return {
    tripCode: "V-001",
    vehicle: { id: "veh-1", unitNumber: "U-001", licensePlate: "ABC-1" },
    driver: { id: "drv-1", fullName: "Conductor Uno" },
    client: null,
    originCity: "CDMX",
    originState: "CMX",
    destinationCity: "GDL",
    destinationState: "JAL",
    scheduledDeparture: new Date("2026-06-03T08:00:00Z"),
    scheduledArrival: null,
    cargoDescription: null,
    totalCost: 0,
    totalRevenue: 0,
    ...overrides,
  } as TripListItem;
}

function vehicle(
  id: string,
  over: Partial<AssignableVehicleItem> = {},
): AssignableVehicleItem {
  return {
    id,
    unitNumber: id,
    licensePlate: "PLATE",
    status: "available",
    canBeAssigned: true,
    ...over,
  } as AssignableVehicleItem;
}

describe("buildBusyAssignmentResourceIds", () => {
  it("includes vehicle and driver from in_progress and scheduled trips", () => {
    const trips = [
      trip({
        id: "t1",
        status: TripStatus.IN_PROGRESS,
        vehicle: { id: "veh-busy", unitNumber: "U-003", licensePlate: "X" },
        driver: { id: "drv-busy", fullName: "Alba Xkarajam" },
        internalStaffEmployeeIds: ["emp-support-1"],
      }),
      trip({
        id: "t2",
        status: TripStatus.SCHEDULED,
        vehicle: { id: "veh-sched", unitNumber: "U-004", licensePlate: "Y" },
        driver: { id: "drv-sched", fullName: "Otro" },
        internalStaffEmployeeIds: ["emp-support-2", "emp-support-3"],
      }),
      trip({
        id: "t3",
        status: TripStatus.COMPLETED,
        vehicle: { id: "veh-free", unitNumber: "U-005", licensePlate: "Z" },
        driver: { id: "drv-free", fullName: "Libre" },
        internalStaffEmployeeIds: ["emp-done"],
      }),
    ];

    const busy = buildBusyAssignmentResourceIds(trips);

    expect([...busy.vehicleIds]).toEqual(["veh-busy", "veh-sched"]);
    expect([...busy.driverIds]).toEqual(["drv-busy", "drv-sched"]);
    expect([...busy.employeeIds]).toEqual([
      "emp-support-1",
      "emp-support-2",
      "emp-support-3",
    ]);
  });

  it("excludes the trip being edited", () => {
    const trips = [
      trip({
        id: "edit-me",
        status: TripStatus.SCHEDULED,
        vehicle: { id: "veh-edit", unitNumber: "U-003", licensePlate: "X" },
        driver: { id: "drv-edit", fullName: "Alba Xkarajam" },
        internalStaffEmployeeIds: ["emp-on-edit-trip"],
      }),
    ];

    const busy = buildBusyAssignmentResourceIds(trips, "edit-me");

    expect(busy.vehicleIds.size).toBe(0);
    expect(busy.driverIds.size).toBe(0);
    expect(busy.employeeIds.size).toBe(0);
  });
});

describe("applyBusyResourcesToVehicles", () => {
  it("blocks assignable vehicles that are on an active trip", () => {
    const result = applyBusyResourcesToVehicles(
      [vehicle("veh-busy"), vehicle("veh-free")],
      new Set(["veh-busy"]),
    );

    expect(result.find((v) => v.id === "veh-busy")).toMatchObject({
      canBeAssigned: false,
      blockReason: "Asignado a un viaje activo",
    });
    expect(result.find((v) => v.id === "veh-free")?.canBeAssigned).toBe(true);
  });

  it("keeps reserved vehicle assignable when it is the trip current assignment", () => {
    const result = applyBusyResourcesToVehicles(
      [
        vehicle("veh-current", {
          status: "reserved",
          canBeAssigned: false,
          blockReason: "Reservado",
        }),
      ],
      new Set(),
      { keepAssignableVehicleId: "veh-current" },
    );

    expect(result[0]).toMatchObject({
      canBeAssigned: true,
      blockReason: undefined,
    });
  });

  it("does not waive reserved for a different vehicle", () => {
    const result = applyBusyResourcesToVehicles(
      [
        vehicle("veh-other", {
          status: "reserved",
          canBeAssigned: false,
          blockReason: "Reservado",
        }),
      ],
      new Set(),
      { keepAssignableVehicleId: "veh-current" },
    );

    expect(result[0]).toMatchObject({
      canBeAssigned: false,
      blockReason: "Reservado",
    });
  });
});
