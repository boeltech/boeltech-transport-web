/**
 * Soft-match SICT category ↔ vehicle type for trip assignment (ADR-0080 F3).
 * Warning only — never changes canBeAssigned / hard-block.
 */

import {
  getDriverLicenseAssignmentSoftSignal,
  type LicenseAssignmentSoftSignal,
} from "@features/drivers";
import type { AssignableVehicleItem } from "@features/vehicles/domain";

import type { AssignableDriverItem } from "./tripAssignmentDrivers";

export function resolveSelectedAssignmentLicenseSoftSignal(
  driver: AssignableDriverItem | undefined,
  vehicle: AssignableVehicleItem | undefined,
): LicenseAssignmentSoftSignal | undefined {
  if (!driver || !vehicle?.type) return undefined;
  return getDriverLicenseAssignmentSoftSignal(driver, vehicle.type);
}

/** Message-only helper for tests / legacy callers. */
export function resolveSelectedAssignmentLicenseSoftWarning(
  driver: AssignableDriverItem | undefined,
  vehicle: AssignableVehicleItem | undefined,
): string | undefined {
  return resolveSelectedAssignmentLicenseSoftSignal(driver, vehicle)?.message;
}
