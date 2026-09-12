import { describe, expect, it } from "vitest";

import { TripStatus, type TripListItem } from "@features/trips/domain";
import type { AssignableVehicleItem } from "@features/vehicles/domain";

import {
  applyBusyResourcesToVehicles,
  applyDraftHoldSoftSignalToVehicles,
  applySoftBusyToTrailers,
  buildBusyAssignmentResourceIds,
  buildDraftHoldAssignmentResourceIds,
  filterTripsOverlappingWindow,
  pickPreferredConflict,
  tripScheduleWindowsOverlap,
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
        tripCode: "V-IP",
        status: TripStatus.IN_PROGRESS,
        vehicle: { id: "veh-busy", unitNumber: "U-003", licensePlate: "X" },
        driver: { id: "drv-busy", fullName: "Alba Xkarajam" },
        internalStaffEmployeeIds: ["emp-support-1"],
      }),
      trip({
        id: "t2",
        tripCode: "V-SCH",
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
    expect(busy.vehicleConflicts.get("veh-busy")?.tripCode).toBe("V-IP");
    expect(busy.driverConflicts.get("drv-sched")?.tripCode).toBe("V-SCH");
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
    expect(busy.vehicleConflicts.size).toBe(0);
  });

  it("prefers in_progress conflict over scheduled for the same resource", () => {
    const trips = [
      trip({
        id: "t-sched",
        tripCode: "V-SCH",
        status: TripStatus.SCHEDULED,
        scheduledDeparture: new Date("2026-06-01T08:00:00Z"),
        vehicle: { id: "veh-x", unitNumber: "U", licensePlate: "X" },
      }),
      trip({
        id: "t-ip",
        tripCode: "V-IP",
        status: TripStatus.IN_PROGRESS,
        scheduledDeparture: new Date("2026-06-10T08:00:00Z"),
        vehicle: { id: "veh-x", unitNumber: "U", licensePlate: "X" },
      }),
    ];

    const busy = buildBusyAssignmentResourceIds(trips);
    expect(busy.vehicleConflicts.get("veh-x")?.tripCode).toBe("V-IP");
  });
});

describe("pickPreferredConflict", () => {
  it("picks earlier scheduled when both scheduled", () => {
    const earlier = {
      tripId: "a",
      tripCode: "A",
      status: TripStatus.SCHEDULED,
      scheduledDeparture: new Date("2026-06-01T08:00:00Z"),
    };
    const later = {
      tripId: "b",
      tripCode: "B",
      status: TripStatus.SCHEDULED,
      scheduledDeparture: new Date("2026-06-05T08:00:00Z"),
    };
    expect(pickPreferredConflict(later, earlier).tripCode).toBe("A");
  });
});

describe("applyBusyResourcesToVehicles", () => {
  it("blocks assignable vehicles that are on an active trip (hard mode)", () => {
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

  it("marks busy vehicles as softBusy when softBusySelectable", () => {
    const conflict = {
      tripId: "t1",
      tripCode: "V-100",
      status: TripStatus.SCHEDULED,
      scheduledDeparture: new Date("2026-06-03T08:00:00Z"),
    };
    const result = applyBusyResourcesToVehicles(
      [vehicle("veh-busy"), vehicle("veh-free")],
      new Set(["veh-busy"]),
      {
        softBusySelectable: true,
        conflicts: new Map([["veh-busy", conflict]]),
      },
    );

    expect(result.find((v) => v.id === "veh-busy")).toMatchObject({
      canBeAssigned: true,
      softBusy: true,
      blockReason: "Programado",
      assignmentConflict: conflict,
    });
    expect(result.find((v) => v.id === "veh-free")?.softBusy).toBeUndefined();
  });

  it("keeps reserved vehicle softBusy when softBusySelectable", () => {
    const result = applyBusyResourcesToVehicles(
      [
        vehicle("veh-reserved", {
          status: "reserved",
          canBeAssigned: false,
          blockReason: "Reservado",
        }),
      ],
      new Set(),
      { softBusySelectable: true },
    );

    expect(result[0]).toMatchObject({
      canBeAssigned: true,
      softBusy: true,
      blockReason: "Reservado",
    });
  });

  it("does not soft-busy hard-blocked docs vehicles", () => {
    const result = applyBusyResourcesToVehicles(
      [
        vehicle("veh-docs", {
          status: "available",
          canBeAssigned: false,
          blockReason: "Seguro vencido",
        }),
      ],
      new Set(["veh-docs"]),
      { softBusySelectable: true },
    );

    expect(result[0]).toMatchObject({
      canBeAssigned: false,
      blockReason: "Seguro vencido",
      softBusy: undefined,
    });
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

  it("keeps on_trip vehicle assignable when it is the trip current assignment", () => {
    const result = applyBusyResourcesToVehicles(
      [
        vehicle("veh-current", {
          status: "on_trip",
          canBeAssigned: false,
          blockReason: "En viaje",
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

  it("does not waive on_trip for a different vehicle", () => {
    const result = applyBusyResourcesToVehicles(
      [
        vehicle("veh-other", {
          status: "on_trip",
          canBeAssigned: false,
          blockReason: "En viaje",
        }),
      ],
      new Set(),
      { keepAssignableVehicleId: "veh-current" },
    );

    expect(result[0]).toMatchObject({
      canBeAssigned: false,
      blockReason: "En viaje",
    });
  });

  it("does not promote reserved+expiredDocs to softBusy when softBusySelectable", () => {
    const result = applyBusyResourcesToVehicles(
      [
        vehicle("veh-expired-reserved", {
          status: "reserved",
          canBeAssigned: false,
          expiredDocsOverridable: true,
          blockReason: "Seguro vencido",
        }),
      ],
      new Set(),
      { softBusySelectable: true },
    );

    expect(result[0]).toMatchObject({
      canBeAssigned: false,
      expiredDocsOverridable: true,
      blockReason: "Seguro vencido",
    });
    expect(result[0]?.softBusy).toBeUndefined();
  });
});

describe("applySoftBusyToTrailers", () => {
  it("makes reserved trailers softBusy when enabled", () => {
    const result = applySoftBusyToTrailers(
      [
        {
          id: "trl-1",
          status: "reserved",
          canBeAssigned: false,
          blockReason: "Reservado",
        },
      ],
      { softBusySelectable: true },
    );

    expect(result[0]).toMatchObject({
      canBeAssigned: true,
      softBusy: true,
      blockReason: "Reservado",
    });
  });

  it("leaves reserved trailers hard-blocked when softBusySelectable is false", () => {
    const result = applySoftBusyToTrailers(
      [
        {
          id: "trl-1",
          status: "reserved",
          canBeAssigned: false,
          blockReason: "Reservado",
        },
      ],
      { softBusySelectable: false },
    );

    expect(result[0]?.softBusy).toBeUndefined();
    expect(result[0]?.canBeAssigned).toBe(false);
  });
});

describe("tripScheduleWindowsOverlap / filterTripsOverlappingWindow", () => {
  it("detects overlapping windows", () => {
    expect(
      tripScheduleWindowsOverlap(
        {
          scheduledDeparture: new Date("2026-08-30T08:00:00Z"),
          scheduledArrival: new Date("2026-08-30T18:00:00Z"),
        },
        {
          scheduledDeparture: new Date("2026-08-30T12:00:00Z"),
          scheduledArrival: new Date("2026-08-30T14:00:00Z"),
        },
      ),
    ).toBe(true);
  });

  it("filters non-overlapping drafts out", () => {
    const filtered = filterTripsOverlappingWindow(
      [
        trip({
          id: "overlap",
          status: TripStatus.DRAFT,
          scheduledDeparture: new Date("2026-08-30T10:00:00Z"),
          scheduledArrival: new Date("2026-08-30T12:00:00Z"),
        }),
        trip({
          id: "far",
          status: TripStatus.DRAFT,
          scheduledDeparture: new Date("2026-09-10T08:00:00Z"),
          scheduledArrival: new Date("2026-09-10T18:00:00Z"),
        }),
      ],
      {
        scheduledDeparture: new Date("2026-08-30T08:00:00Z"),
        scheduledArrival: new Date("2026-08-30T18:00:00Z"),
      },
    );
    expect(filtered.map((t) => t.id)).toEqual(["overlap"]);
  });
});

describe("buildDraftHoldAssignmentResourceIds + applyDraftHoldSoftSignal", () => {
  it("only includes draft resources", () => {
    const holds = buildDraftHoldAssignmentResourceIds([
      trip({
        id: "d1",
        tripCode: "RSV-1",
        status: TripStatus.DRAFT,
        vehicle: { id: "veh-hold", unitNumber: "U", licensePlate: "X" },
        driver: { id: "drv-hold", fullName: "Hold" },
      }),
      trip({
        id: "s1",
        status: TripStatus.SCHEDULED,
        vehicle: { id: "veh-sched", unitNumber: "U2", licensePlate: "Y" },
      }),
    ]);
    expect([...holds.vehicleIds]).toEqual(["veh-hold"]);
    expect([...holds.driverIds]).toEqual(["drv-hold"]);
  });

  it("marks assignable vehicles soft without hard-blocking", () => {
    const conflict = {
      tripId: "d1",
      tripCode: "RSV-1",
      status: TripStatus.DRAFT,
      scheduledDeparture: new Date("2026-08-30T10:00:00Z"),
    };
    const hardApplied = applyBusyResourcesToVehicles(
      [vehicle("veh-hold"), vehicle("veh-free")],
      new Set(),
    );
    const result = applyDraftHoldSoftSignalToVehicles(
      hardApplied,
      new Set(["veh-hold"]),
      { conflicts: new Map([["veh-hold", conflict]]) },
    );
    expect(result.find((v) => v.id === "veh-hold")).toMatchObject({
      canBeAssigned: true,
      softBusy: true,
      blockReason: "Reserva",
    });
    expect(result.find((v) => v.id === "veh-free")?.softBusy).toBeUndefined();
  });

  it("does not override hard-busy vehicles", () => {
    const hardBlocked = applyBusyResourcesToVehicles(
      [vehicle("veh-busy")],
      new Set(["veh-busy"]),
    );
    const result = applyDraftHoldSoftSignalToVehicles(
      hardBlocked,
      new Set(["veh-busy"]),
    );
    expect(result[0]).toMatchObject({
      canBeAssigned: false,
      softBusy: undefined,
    });
  });
});
