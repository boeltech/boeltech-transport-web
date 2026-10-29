import type { FleetAvailabilityConflict } from "@shared/api/errors/fleetAvailabilityConflictError";

import { tripDetailCopy } from "../copy";

const copy = tripDetailCopy.shell.fleetAvailability;

export function fleetConflictResourceTypeLabel(
  resourceType: FleetAvailabilityConflict["resourceType"],
): string {
  switch (resourceType) {
    case "vehicle":
      return copy.typeVehicle;
    case "trailer":
      return copy.typeTrailer;
    case "driver":
      return copy.typeDriver;
    case "internal_staff":
      return copy.typeStaff;
    default:
      return copy.typeStaff;
  }
}

export function fleetConflictRoleLabel(
  role: NonNullable<FleetAvailabilityConflict["role"]>,
): string {
  return role === "secondary_driver"
    ? copy.roleSecondaryDriver
    : copy.roleHelper;
}

/** Línea: tipo [(rol)] · identidad · viaje peer. */
export function formatFleetAvailabilityConflictLine(
  conflict: FleetAvailabilityConflict,
): string {
  const typeLabel = fleetConflictResourceTypeLabel(conflict.resourceType);
  const typeWithRole = conflict.role
    ? `${typeLabel} (${fleetConflictRoleLabel(conflict.role)})`
    : typeLabel;
  return `${typeWithRole} · ${conflict.displayLabel} · ${conflict.conflictingTripCode}`;
}

export function formatFleetAvailabilityConflictLines(
  conflicts: readonly FleetAvailabilityConflict[],
): string[] {
  return conflicts.map(formatFleetAvailabilityConflictLine);
}

/** Descripción de toast cuando no hay dialog/sheet de error. */
export function formatFleetAvailabilityConflictToastDescription(
  conflicts: readonly FleetAvailabilityConflict[],
): string {
  const lines = formatFleetAvailabilityConflictLines(conflicts);
  return lines.length > 0 ? lines.join("\n") : copy.confirmTitle;
}
