import type { DriverListItem } from "@features/drivers/domain";
import { isExpiringSoon } from "@shared/utils/dateUtils";

import { BUSY_ON_ACTIVE_TRIP } from "./tripAssignmentBusyResources";

export interface AssignableDriverItem extends DriverListItem {
  canBeAssigned: boolean;
  blockReason?: string;
  displayName: string;
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

export function classifyDriverAssignability(
  driver: DriverListItem,
): Pick<AssignableDriverItem, "canBeAssigned" | "blockReason"> {
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
    return {
      canBeAssigned: false,
      blockReason: statusReasons[driver.status] || driver.status,
    };
  }

  if (driver.isLicenseExpired) {
    return { canBeAssigned: false, blockReason: "Licencia vencida" };
  }

  if (isExpiringSoon(driver.licenseExpiry, 30)) {
    return { canBeAssigned: true, blockReason: undefined };
  }

  return { canBeAssigned: true, blockReason: undefined };
}

export function buildAssignableDriversForTripWizard(
  drivers: readonly DriverListItem[],
  busyDriverIds: ReadonlySet<string>,
): AssignableDriverItem[] {
  return drivers.map((driver) => {
    const { canBeAssigned, blockReason } = classifyDriverAssignability(driver);

    if (canBeAssigned && busyDriverIds.has(driver.id)) {
      return {
        ...driver,
        canBeAssigned: false,
        blockReason: BUSY_ON_ACTIVE_TRIP,
        displayName: getDriverDisplayName(driver),
      };
    }

    return {
      ...driver,
      canBeAssigned,
      blockReason,
      displayName: getDriverDisplayName(driver),
    };
  });
}
