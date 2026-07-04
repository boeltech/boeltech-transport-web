import type { EmployeeDriverRole } from "../../domain/entities";
import { DRIVER_STATUS_LABELS, type DriverStatusType } from "@features/drivers/domain";
import { employeesCopy } from "../copy";

const alertCopy = employeesCopy.detail.alert.driverRole;

export interface EmployeeDriverRoleAlertContent {
  severity: "warning" | "info";
  title: string;
  items: { text: string }[];
}

function driverStatusLabel(status: string): string {
  return (
    DRIVER_STATUS_LABELS[status as DriverStatusType] ??
    status.replaceAll("_", " ")
  );
}

/**
 * Copy para DetailAlertCard cuando el empleado tiene rol de conductor activo.
 */
export function buildEmployeeDriverRoleAlert(
  driverRole: EmployeeDriverRole,
): EmployeeDriverRoleAlertContent {
  const statusLabel = driverStatusLabel(driverRole.driverStatus);
  const items: { text: string }[] = [
    {
      text: alertCopy.statusLine(statusLabel),
    },
  ];

  if (driverRole.activeTripCount > 0) {
    const codesSuffix = employeesCopy.detail.format.activeTripCodesSuffix(
      driverRole.activeTripCodes,
    );
    items.push({
      text: alertCopy.activeTripsLine(driverRole.activeTripCount, codesSuffix),
    });
  }

  if (driverRole.blocksEmployeeTermination) {
    if (driverRole.driverStatus === "on_trip") {
      items.push({ text: alertCopy.blockOnTrip });
    } else {
      items.push({ text: alertCopy.blockActiveTrips });
    }

    return {
      severity: "warning",
      title: alertCopy.pendingTitle,
      items,
    };
  }

  items.push({ text: alertCopy.autoDeactivate });

  return {
    severity: "info",
    title: alertCopy.activeTitle,
    items,
  };
}
