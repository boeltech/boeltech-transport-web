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

const BUSY_ON_ACTIVE_TRIP = "Asignado a un viaje activo";
const HELD_ON_DRAFT_RESERVE = "En reserva";

export { BUSY_ON_ACTIVE_TRIP, HELD_ON_DRAFT_RESERVE };

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

/**
 * Canonical occupancy badge for assignment selects.
 * Maps trip status ↔ fleet commit status to the same label so unidad,
 * conductor and remolque never diverge (e.g. "En Curso" vs "En viaje").
 */
export const FLEET_OCCUPANCY_BADGE = {
  ON_TRIP: "En Viaje",
  RESERVED: "Reservado",
} as const;

export function assignmentOccupancyBadgeLabel(
  status: string | null | undefined,
): string | null {
  switch (status) {
    case "on_trip":
    case TripStatus.IN_PROGRESS:
      return FLEET_OCCUPANCY_BADGE.ON_TRIP;
    case "reserved":
    case TripStatus.SCHEDULED:
      return FLEET_OCCUPANCY_BADGE.RESERVED;
    default:
      return null;
  }
}

export function conflictBadgeLabel(conflict: {
  status: TripStatusType | string;
}): string {
  return (
    assignmentOccupancyBadgeLabel(conflict.status) ??
    TRIP_STATUS_LABELS[conflict.status as TripStatusType] ??
    String(conflict.status)
  );
}

/** True when blockReason is only occupancy (soft-busy may promote). */
export function isFleetStatusOnlyOccupancyBlock(
  status: string | undefined,
  blockReason: string | undefined,
): boolean {
  if (!blockReason) return false;
  if (blockReason === BUSY_ON_ACTIVE_TRIP) return true;
  const occupancy = assignmentOccupancyBadgeLabel(status);
  if (occupancy && blockReason === occupancy) return true;
  // Legacy casing from older classifiers / trailers.
  if (status === "on_trip" && blockReason === "En viaje") return true;
  return false;
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
  return buildBusyAssignmentResourceIdsFromStatuses(
    trips,
    excludeTripId,
    ACTIVE_ASSIGNMENT_STATUSES,
  );
}

function toScheduleMs(value: Date | null | undefined): number | null {
  if (!value || Number.isNaN(value.getTime())) return null;
  return value.getTime();
}

/** Inclusive interval overlap; missing arrival collapses to departure instant. */
export function tripScheduleWindowsOverlap(
  a: {
    scheduledDeparture: Date | null | undefined;
    scheduledArrival?: Date | null | undefined;
  },
  b: {
    scheduledDeparture: Date | null | undefined;
    scheduledArrival?: Date | null | undefined;
  },
): boolean {
  const aStart = toScheduleMs(a.scheduledDeparture);
  const bStart = toScheduleMs(b.scheduledDeparture);
  if (aStart == null || bStart == null) return false;
  const aEnd = toScheduleMs(a.scheduledArrival) ?? aStart;
  const bEnd = toScheduleMs(b.scheduledArrival) ?? bStart;
  return aStart <= bEnd && bStart <= aEnd;
}

export function filterTripsOverlappingWindow(
  trips: readonly TripListItem[],
  window: {
    scheduledDeparture: Date | null | undefined;
    scheduledArrival?: Date | null | undefined;
  },
): TripListItem[] {
  return trips.filter((trip) =>
    tripScheduleWindowsOverlap(
      {
        scheduledDeparture: trip.scheduledDeparture,
        scheduledArrival: trip.scheduledArrival,
      },
      window,
    ),
  );
}

/**
 * Soft-hold resources from draft (Reserva) trips only.
 * Caller should pass draft-only list (PD5 — never merge into hard busy).
 */
export function buildDraftHoldAssignmentResourceIds(
  trips: readonly TripListItem[],
  excludeTripId?: string,
): BusyAssignmentResourceIds {
  const draftOnly = trips.filter((trip) => trip.status === TripStatus.DRAFT);
  return buildBusyAssignmentResourceIdsFromStatuses(
    draftOnly,
    excludeTripId,
    [TripStatus.DRAFT],
  );
}

function buildBusyAssignmentResourceIdsFromStatuses(
  trips: readonly TripListItem[],
  excludeTripId: string | undefined,
  statuses: readonly TripStatusType[],
): BusyAssignmentResourceIds {
  const vehicleIds = new Set<string>();
  const driverIds = new Set<string>();
  const employeeIds = new Set<string>();
  const vehicleConflicts = new Map<string, AssignmentConflict>();
  const driverConflicts = new Map<string, AssignmentConflict>();
  const employeeConflicts = new Map<string, AssignmentConflict>();

  for (const trip of trips) {
    if (excludeTripId && trip.id === excludeTripId) continue;
    if (!statuses.includes(trip.status)) continue;

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

/**
 * Marks draft-hold resources as selectable softBusy (hard busy already applied).
 * Hard-blocked resources win — holds never override operational busy.
 */
export function applyDraftHoldSoftSignalToVehicles(
  vehicles: readonly AssignableVehicleItem[],
  holdVehicleIds: ReadonlySet<string>,
  options?: {
    conflicts?: ReadonlyMap<string, AssignmentConflict>;
  },
): AssignableVehicleItem[] {
  const conflicts = options?.conflicts;
  return vehicles.map((vehicle) => {
    if (!holdVehicleIds.has(vehicle.id)) return vehicle;
    if (!vehicle.canBeAssigned || vehicle.softBusy) return vehicle;

    const conflict = conflicts?.get(vehicle.id);
    return {
      ...vehicle,
      canBeAssigned: true as const,
      softBusy: true as const,
      assignmentConflict: conflict,
      // Keep expired-docs reason for reopen alert; soft-hold uses assignmentConflict.
      blockReason:
        vehicle.expiredDocsOverridable === true && vehicle.blockReason
          ? vehicle.blockReason
          : conflict
            ? conflictBadgeLabel(conflict)
            : HELD_ON_DRAFT_RESERVE,
    };
  });
}

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

    // Current trip assignment: grandfather reopen (draft / scheduled / in_progress).
    // Keep expiredDocsOverridable + reason for alert; never softBusy / fleetHardBlocked.
    if (keepId && vehicle.id === keepId) {
      return {
        ...vehicle,
        canBeAssigned: true as const,
        softBusy: undefined,
        fleetHardBlocked: undefined,
        assignmentConflict: undefined,
        blockReason:
          vehicle.expiredDocsOverridable === true
            ? vehicle.blockReason
            : undefined,
      };
    }

    if (soft) {
      // Docs / mantenimiento / fuera de servicio: siguen hard aunque también estén busy.
      if (!vehicle.canBeAssigned && !isCommitStatus) {
        return {
          ...vehicle,
          softBusy: undefined,
          fleetHardBlocked: undefined,
          assignmentConflict: undefined,
        };
      }

      if (isBusy || isCommitStatus) {
        // ADR-0066: expired docs stay gated by allowExpiredDocs — do not promote
        // reserved/on_trip (or busy) into soft-busy selectable.
        // Product priority: «Con documentación vencida» over «En otro viaje».
        if (vehicle.expiredDocsOverridable === true) {
          return {
            ...vehicle,
            canBeAssigned: false as const,
            softBusy: undefined,
            fleetHardBlocked: undefined,
            assignmentConflict: conflict,
          };
        }
        // Hard docs / stamp incomplete on commit status: keep non-selectable.
        // Pure status blocks («En Viaje» / «Reservado») still soft-promote below.
        if (!vehicle.canBeAssigned) {
          if (
            !isFleetStatusOnlyOccupancyBlock(
              vehicle.status,
              vehicle.blockReason,
            )
          ) {
            return {
              ...vehicle,
              softBusy: undefined,
              fleetHardBlocked: undefined,
              assignmentConflict: conflict,
            };
          }
        }
        return {
          ...vehicle,
          canBeAssigned: true as const,
          softBusy: true as const,
          fleetHardBlocked: undefined,
          assignmentConflict: conflict,
          blockReason: conflict
            ? conflictBadgeLabel(conflict)
            : (assignmentOccupancyBadgeLabel(vehicle.status) ??
              vehicle.blockReason ??
              BUSY_ON_ACTIVE_TRIP),
        };
      }

      return {
        ...vehicle,
        softBusy: undefined,
        fleetHardBlocked: undefined,
        assignmentConflict: undefined,
      };
    }

    // Hard mode (scheduled / in_progress): occupation is never liberated by
    // allowExpiredDocs — including when the classifier already marked expired docs.
    if (isBusy || isCommitStatus) {
      const occupancyReason = conflict
        ? conflictBadgeLabel(conflict)
        : (assignmentOccupancyBadgeLabel(vehicle.status) ?? BUSY_ON_ACTIVE_TRIP);
      return {
        ...vehicle,
        canBeAssigned: false as const,
        fleetHardBlocked: true as const,
        softBusy: undefined,
        assignmentConflict: conflict,
        blockReason: occupancyReason,
      };
    }

    return {
      ...vehicle,
      fleetHardBlocked: undefined,
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
        blockReason:
          assignmentOccupancyBadgeLabel(trailer.status) ??
          trailer.blockReason ??
          BUSY_ON_ACTIVE_TRIP,
      };
    }

    return {
      ...trailer,
      softBusy: undefined,
      assignmentConflict: undefined,
    };
  });
}
