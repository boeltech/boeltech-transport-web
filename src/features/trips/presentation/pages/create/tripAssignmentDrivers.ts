import type { DriverListItem } from "@features/drivers/domain";
import { getDriverPrimaryLicenseExpiry } from "@features/drivers/domain";
import { isExpiringSoon } from "@shared/utils/dateUtils";

import {
  BUSY_ON_ACTIVE_TRIP,
  HELD_ON_DRAFT_RESERVE,
  conflictBadgeLabel,
  type AssignmentConflict,
} from "./tripAssignmentBusyResources";

export interface AssignableDriverItem extends DriverListItem {
  canBeAssigned: boolean;
  blockReason?: string;
  displayName: string;
  expiredDocsOverridable?: boolean;
  softBusy?: boolean;
  assignmentConflict?: AssignmentConflict;
}

function getDriverDisplayName(driver: DriverListItem): string {
  if (driver.employee.fullName) return driver.employee.fullName;

  const employee = driver.employee as {
    firstName?: string;
    lastName?: string;
    secondLastName?: string;
  };
  if (employee.firstName) {
    return [employee.firstName, employee.lastName, employee.secondLastName]
      .filter(Boolean)
      .join(" ");
  }

  return "Sin nombre";
}

function isFleetCommitStatus(status: string): boolean {
  return status === "reserved" || status === "on_trip";
}

export function classifyDriverAssignability(
  driver: DriverListItem,
): Pick<
  AssignableDriverItem,
  "canBeAssigned" | "blockReason" | "expiredDocsOverridable"
> {
  if (!driver.isActive) {
    return { canBeAssigned: false, blockReason: "Inactivo" };
  }

  if (driver.status !== "available") {
    const statusReasons: Record<string, string> = {
      reserved: "Reservado",
      on_trip: "En viaje",
      resting: "Descansando",
      on_vacation: "De vacaciones",
      on_leave: "Con permiso",
      terminated: "Dado de baja",
    };
    // reserved/on_trip are fleet-commit statuses: surface expired docs so soft-busy
    // cannot promote them without allowExpiredDocs (parity with vehicles ADR-0066).
    if (
      (driver.status === "reserved" || driver.status === "on_trip") &&
      (driver.isFederalLicenseExpired || driver.isStateLicenseExpired)
    ) {
      return {
        canBeAssigned: false,
        blockReason: "Licencia vencida",
        expiredDocsOverridable: true,
      };
    }
    return {
      canBeAssigned: false,
      blockReason: statusReasons[driver.status] || driver.status,
    };
  }

  if (driver.isFederalLicenseExpired || driver.isStateLicenseExpired) {
    return {
      canBeAssigned: false,
      blockReason: "Licencia vencida",
      expiredDocsOverridable: true,
    };
  }

  const primaryLicenseExpiry = getDriverPrimaryLicenseExpiry(driver);
  if (primaryLicenseExpiry && isExpiringSoon(primaryLicenseExpiry, 30)) {
    return { canBeAssigned: true, blockReason: undefined };
  }

  return { canBeAssigned: true, blockReason: undefined };
}

export type BuildAssignableDriversOptions = {
  keepAssignableDriverId?: string;
  softBusySelectable?: boolean;
  conflicts?: ReadonlyMap<string, AssignmentConflict>;
};

export function buildAssignableDriversForTripWizard(
  drivers: readonly DriverListItem[],
  busyDriverIds: ReadonlySet<string>,
  options?: BuildAssignableDriversOptions,
): AssignableDriverItem[] {
  const keepId = options?.keepAssignableDriverId?.trim() || undefined;
  const soft = options?.softBusySelectable === true;
  const conflicts = options?.conflicts;

  return drivers.map((driver) => {
    const { canBeAssigned, blockReason, expiredDocsOverridable } =
      classifyDriverAssignability(driver);

    const displayName = getDriverDisplayName(driver);
    const conflict = conflicts?.get(driver.id);
    const isBusy = busyDriverIds.has(driver.id);
    const isCommitStatus = isFleetCommitStatus(driver.status);

    // Current trip assignment: reserved (scheduled) or on_trip (in progress / ADR-0093).
    if (keepId && driver.id === keepId && isFleetCommitStatus(driver.status)) {
      return {
        ...driver,
        canBeAssigned: true,
        blockReason: undefined,
        expiredDocsOverridable,
        softBusy: undefined,
        assignmentConflict: undefined,
        displayName,
      };
    }

    if (soft) {
      if (!canBeAssigned && !isCommitStatus) {
        return {
          ...driver,
          canBeAssigned,
          blockReason,
          expiredDocsOverridable,
          softBusy: undefined,
          assignmentConflict: undefined,
          displayName,
        };
      }

      if (isBusy || isCommitStatus) {
        // ADR-0066: expired docs stay gated by allowExpiredDocs — do not promote
        // reserved/on_trip (or busy) into soft-busy selectable.
        if (expiredDocsOverridable === true) {
          return {
            ...driver,
            canBeAssigned: false,
            blockReason,
            expiredDocsOverridable,
            softBusy: undefined,
            assignmentConflict: conflict,
            displayName,
          };
        }
        return {
          ...driver,
          canBeAssigned: true,
          softBusy: true,
          assignmentConflict: conflict,
          blockReason: conflict
            ? conflictBadgeLabel(conflict)
            : (blockReason ?? BUSY_ON_ACTIVE_TRIP),
          expiredDocsOverridable,
          displayName,
        };
      }

      return {
        ...driver,
        canBeAssigned,
        blockReason,
        expiredDocsOverridable,
        softBusy: undefined,
        assignmentConflict: undefined,
        displayName,
      };
    }

    if (canBeAssigned && isBusy) {
      return {
        ...driver,
        canBeAssigned: false,
        blockReason: BUSY_ON_ACTIVE_TRIP,
        displayName,
        softBusy: undefined,
        assignmentConflict: undefined,
      };
    }

    if (
      !canBeAssigned &&
      keepId &&
      driver.id === keepId &&
      isFleetCommitStatus(driver.status)
    ) {
      return {
        ...driver,
        canBeAssigned: true,
        blockReason: undefined,
        expiredDocsOverridable,
        softBusy: undefined,
        assignmentConflict: undefined,
        displayName,
      };
    }

    return {
      ...driver,
      canBeAssigned,
      blockReason,
      expiredDocsOverridable,
      softBusy: undefined,
      assignmentConflict: undefined,
      displayName,
    };
  });
}

/**
 * Marks draft-hold drivers as selectable softBusy after hard busy was applied.
 */
export function applyDraftHoldSoftSignalToDrivers(
  drivers: readonly AssignableDriverItem[],
  holdDriverIds: ReadonlySet<string>,
  options?: {
    conflicts?: ReadonlyMap<string, AssignmentConflict>;
  },
): AssignableDriverItem[] {
  const conflicts = options?.conflicts;
  return drivers.map((driver) => {
    if (!holdDriverIds.has(driver.id)) return driver;
    if (!driver.canBeAssigned || driver.softBusy) return driver;

    const conflict = conflicts?.get(driver.id);
    return {
      ...driver,
      canBeAssigned: true,
      softBusy: true,
      assignmentConflict: conflict,
      blockReason: conflict
        ? conflictBadgeLabel(conflict)
        : HELD_ON_DRAFT_RESERVE,
    };
  });
}
