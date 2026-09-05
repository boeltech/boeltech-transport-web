import type { AssignableVehicleItem } from "@features/vehicles/domain";
import {
  TripStatus,
  TRIP_STATUS_LABELS,
  type TripListItem,
  type TripStatusType,
} from "@features/trips/domain";

const ACTIVE_ASSIGNMENT_STATUSES: readonly TripStatusType[] = [
  TripStatus.IN_PROGRESS,
  TripStatus.SCHEDULED,
];

/** Conflicto de asignación con otro viaje activo (scheduled / in_progress). */
export type AssignmentConflict = {
  tripId: string;
  tripCode: string;
  status: TripStatusType;
  scheduledDeparture: Date | null;
};

export type BusyAssignmentResourceIds = {
  vehicleIds: ReadonlySet<string>;
  driverIds: ReadonlySet<string>;
  employeeIds: ReadonlySet<string>;
  vehicleConflicts: ReadonlyMap<string, AssignmentConflict>;
  driverConflicts: ReadonlyMap<string, AssignmentConflict>;
  employeeConflicts: ReadonlyMap<string, AssignmentConflict>;
};

export const EMPTY_BUSY_ASSIGNMENT_RESOURCES: BusyAssignmentResourceIds = {
  vehicleIds: new Set(),
  driverIds: new Set(),
  employeeIds: new Set(),
  vehicleConflicts: new Map(),
  driverConflicts: new Map(),
  employeeConflicts: new Map(),
};

function conflictFromTrip(trip: TripListItem): AssignmentConflict {
  return {
    tripId: trip.id,
    tripCode: trip.tripCode,
    status: trip.status,
    scheduledDeparture: trip.scheduledDeparture ?? null,
  };
}

/** Prefiere in_progress; si empatan, la salida más próxima. */
export function pickPreferredConflict(
  existing: AssignmentConflict | undefined,
  candidate: AssignmentConflict,
): AssignmentConflict {
  if (!existing) return candidate;

  const existingInProgress = existing.status === TripStatus.IN_PROGRESS;
  const candidateInProgress = candidate.status === TripStatus.IN_PROGRESS;
  if (candidateInProgress && !existingInProgress) return candidate;
  if (existingInProgress && !candidateInProgress) return existing;

  const existingTs =
    existing.scheduledDeparture?.getTime() ?? Number.POSITIVE_INFINITY;
  const candidateTs =
    candidate.scheduledDeparture?.getTime() ?? Number.POSITIVE_INFINITY;
  return candidateTs < existingTs ? candidate : existing;
}

export function conflictBadgeLabel(conflict: {
  status: TripStatusType | string;
}): string {
  const status = conflict.status as TripStatusType;
  return TRIP_STATUS_LABELS[status] ?? String(conflict.status);
}

export function formatConflictDeparture(
  departure: Date | null | undefined,
): string | null {
  if (!departure || Number.isNaN(departure.getTime())) return null;
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(departure);
}

export function buildBusyAssignmentResourceIds(
  trips: readonly TripListItem[],
  excludeTripId?: string,
): BusyAssignmentResourceIds {
  const vehicleIds = new Set<string>();
  const driverIds = new Set<string>();
  const employeeIds = new Set<string>();
  const vehicleConflicts = new Map<string, AssignmentConflict>();
  const driverConflicts = new Map<string, AssignmentConflict>();
  const employeeConflicts = new Map<string, AssignmentConflict>();

  for (const trip of trips) {
    if (excludeTripId && trip.id === excludeTripId) continue;
    if (!ACTIVE_ASSIGNMENT_STATUSES.includes(trip.status)) continue;

    const conflict = conflictFromTrip(trip);

    if (trip.vehicle?.id) {
      vehicleIds.add(trip.vehicle.id);
      vehicleConflicts.set(
        trip.vehicle.id,
        pickPreferredConflict(vehicleConflicts.get(trip.vehicle.id), conflict),
      );
    }
    if (trip.driver?.id) {
      driverIds.add(trip.driver.id);
      driverConflicts.set(
        trip.driver.id,
        pickPreferredConflict(driverConflicts.get(trip.driver.id), conflict),
      );
    }
    for (const employeeId of trip.internalStaffEmployeeIds ?? []) {
      if (!employeeId) continue;
      employeeIds.add(employeeId);
      employeeConflicts.set(
        employeeId,
        pickPreferredConflict(employeeConflicts.get(employeeId), conflict),
      );
    }
  }

  return {
    vehicleIds,
    driverIds,
    employeeIds,
    vehicleConflicts,
    driverConflicts,
    employeeConflicts,
  };
}

const BUSY_ON_ACTIVE_TRIP = "Asignado a un viaje activo";

export { BUSY_ON_ACTIVE_TRIP };

function isFleetCommitStatus(status: string | undefined): boolean {
  return status === "reserved" || status === "on_trip";
}

export type ApplyBusyResourceOptions = {
  keepAssignableVehicleId?: string;
  /** Draft intake: soft-busy selectable. Scheduled/in_progress sheet: false. */
  softBusySelectable?: boolean;
  conflicts?: ReadonlyMap<string, AssignmentConflict>;
};

export function applyBusyResourcesToVehicles(
  vehicles: readonly AssignableVehicleItem[],
  busyVehicleIds: ReadonlySet<string>,
  options?: ApplyBusyResourceOptions,
): AssignableVehicleItem[] {
  const keepId = options?.keepAssignableVehicleId?.trim() || undefined;
  const soft = options?.softBusySelectable === true;
  const conflicts = options?.conflicts;

  return vehicles.map((vehicle) => {
    const conflict = conflicts?.get(vehicle.id);
    const isBusy = busyVehicleIds.has(vehicle.id);
    const isCommitStatus = isFleetCommitStatus(vehicle.status);

    if (keepId && vehicle.id === keepId && vehicle.status === "reserved") {
      return {
        ...vehicle,
        canBeAssigned: true as const,
        blockReason: undefined,
        softBusy: undefined,
        assignmentConflict: undefined,
      };
    }

    if (soft) {
      // Docs / mantenimiento / fuera de servicio: siguen hard aunque también estén busy.
      if (!vehicle.canBeAssigned && !isCommitStatus) {
        return {
          ...vehicle,
          softBusy: undefined,
          assignmentConflict: undefined,
        };
      }

      if (isBusy || isCommitStatus) {
        return {
          ...vehicle,
          canBeAssigned: true as const,
          softBusy: true as const,
          assignmentConflict: conflict,
          blockReason: conflict
            ? conflictBadgeLabel(conflict)
            : (vehicle.blockReason ?? BUSY_ON_ACTIVE_TRIP),
        };
      }

      return {
        ...vehicle,
        softBusy: undefined,
        assignmentConflict: undefined,
      };
    }

    let next = vehicle;

    if (isBusy && vehicle.canBeAssigned) {
      next = {
        ...vehicle,
        canBeAssigned: false as const,
        blockReason: BUSY_ON_ACTIVE_TRIP,
        softBusy: undefined,
        assignmentConflict: undefined,
      };
    }

    if (
      !next.canBeAssigned &&
      keepId &&
      next.id === keepId &&
      next.status === "reserved"
    ) {
      return {
        ...next,
        canBeAssigned: true as const,
        blockReason: undefined,
        softBusy: undefined,
        assignmentConflict: undefined,
      };
    }

    return {
      ...next,
      softBusy: undefined,
      assignmentConflict: undefined,
    };
  });
}

export type SoftBusyTrailerLike = {
  id: string;
  status: string;
  canBeAssigned: boolean;
  blockReason?: string;
  softBusy?: boolean;
  assignmentConflict?: AssignmentConflict;
};

export function applySoftBusyToTrailers<T extends SoftBusyTrailerLike>(
  trailers: readonly T[],
  options?: {
    softBusySelectable?: boolean;
    keepAssignableTrailerIds?: ReadonlySet<string>;
  },
): T[] {
  const soft = options?.softBusySelectable === true;
  const keep = options?.keepAssignableTrailerIds;

  if (!soft) {
    return trailers.map((trailer) => ({
      ...trailer,
      softBusy: undefined,
      assignmentConflict: undefined,
    }));
  }

  return trailers.map((trailer) => {
    if (keep?.has(trailer.id)) {
      return {
        ...trailer,
        canBeAssigned: true as const,
        softBusy: undefined,
        assignmentConflict: undefined,
        blockReason: undefined,
      };
    }

    if (!trailer.canBeAssigned && isFleetCommitStatus(trailer.status)) {
      return {
        ...trailer,
        canBeAssigned: true as const,
        softBusy: true as const,
        blockReason: trailer.blockReason ?? BUSY_ON_ACTIVE_TRIP,
      };
    }

    return {
      ...trailer,
      softBusy: undefined,
      assignmentConflict: undefined,
    };
  });
}
