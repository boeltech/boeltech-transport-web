import type { AssignableVehicleItem } from "@features/vehicles/domain";
import { TripStatus, type TripListItem, type TripStatusType } from "@features/trips/domain";

const ACTIVE_ASSIGNMENT_STATUSES: readonly TripStatusType[] = [
  TripStatus.IN_PROGRESS,
  TripStatus.SCHEDULED,
];

export type BusyAssignmentResourceIds = {
  vehicleIds: ReadonlySet<string>;
  driverIds: ReadonlySet<string>;
  employeeIds: ReadonlySet<string>;
};

export function buildBusyAssignmentResourceIds(
  trips: readonly TripListItem[],
  excludeTripId?: string,
): BusyAssignmentResourceIds {
  const vehicleIds = new Set<string>();
  const driverIds = new Set<string>();
  const employeeIds = new Set<string>();

  for (const trip of trips) {
    if (excludeTripId && trip.id === excludeTripId) continue;
    if (!ACTIVE_ASSIGNMENT_STATUSES.includes(trip.status)) continue;
    if (trip.vehicle?.id) vehicleIds.add(trip.vehicle.id);
    if (trip.driver?.id) driverIds.add(trip.driver.id);
    for (const employeeId of trip.internalStaffEmployeeIds ?? []) {
      if (employeeId) employeeIds.add(employeeId);
    }
  }

  return { vehicleIds, driverIds, employeeIds };
}

const BUSY_ON_ACTIVE_TRIP = "Asignado a un viaje activo";

export { BUSY_ON_ACTIVE_TRIP };

export function applyBusyResourcesToVehicles(
  vehicles: readonly AssignableVehicleItem[],
  busyVehicleIds: ReadonlySet<string>,
): AssignableVehicleItem[] {
  if (busyVehicleIds.size === 0) return [...vehicles];

  return vehicles.map((vehicle) => {
    if (!busyVehicleIds.has(vehicle.id) || !vehicle.canBeAssigned) {
      return vehicle;
    }
    return {
      ...vehicle,
      canBeAssigned: false as const,
      blockReason: BUSY_ON_ACTIVE_TRIP,
    };
  });
}
