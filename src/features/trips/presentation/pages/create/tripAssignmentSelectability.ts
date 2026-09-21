type AssignableVehicleLike = {
  id?: string;
  canBeAssigned: boolean;
  expiredDocsOverridable?: boolean;
  softBusy?: boolean;
  /** Occupied on another trip in hard mode — never liberated by docs toggle. */
  fleetHardBlocked?: boolean;
};

type AssignableDriverLike = {
  id?: string;
  canBeAssigned: boolean;
  expiredDocsOverridable?: boolean;
  softBusy?: boolean;
  fleetHardBlocked?: boolean;
};

export type AssignmentSelectabilityOptions = {
  allowExpiredDocs: boolean;
  inBranchScope: boolean;
  /**
   * Resource already assigned to the trip being edited.
   * Grandfather reopen: do not clear for expired docs / softBusy when toggle is off.
   * Never overrides fleetHardBlocked or out-of-branch.
   */
  keepResourceId?: string;
};

/**
 * Docs-overridable resources that are also hard-busy must stay in the blocked
 * group — allowExpiredDocs must not move them into the expired-docs select group.
 */
export function isExpiredDocsGroupMember(
  item:
    | {
        canBeAssigned: boolean;
        softBusy?: boolean;
        expiredDocsOverridable?: boolean;
        fleetHardBlocked?: boolean;
      }
    | undefined,
  allowExpiredDocs: boolean,
): boolean {
  if (!item || !allowExpiredDocs) return false;
  if (item.fleetHardBlocked === true) return false;
  if (item.canBeAssigned || item.softBusy) return false;
  return item.expiredDocsOverridable === true;
}

function isKeepCurrentResource(
  resourceId: string | undefined,
  options: AssignmentSelectabilityOptions,
): boolean {
  const keepId = options.keepResourceId?.trim();
  if (!keepId || !resourceId) return false;
  return resourceId === keepId;
}

export function isVehicleSelectableWithFilters(
  vehicle: AssignableVehicleLike | undefined,
  options: AssignmentSelectabilityOptions,
): boolean {
  if (!vehicle || !options.inBranchScope) return false;
  if (vehicle.fleetHardBlocked === true) return false;

  const isKeepCurrent = isKeepCurrentResource(vehicle.id, options);

  // ADR-0066: softBusy must not bypass the expired-docs gate — except keep-current
  // grandfather (sheet reopen with assignment that already has expired docs).
  if (
    vehicle.expiredDocsOverridable === true &&
    !options.allowExpiredDocs
  ) {
    if (isKeepCurrent) return true;
    return vehicle.canBeAssigned === true && vehicle.softBusy !== true;
  }
  if (vehicle.canBeAssigned) return true;
  if (vehicle.softBusy) return true;
  if (isKeepCurrent && vehicle.expiredDocsOverridable === true) return true;
  return options.allowExpiredDocs && vehicle.expiredDocsOverridable === true;
}

export function isDriverSelectableWithFilters(
  driver: AssignableDriverLike | undefined,
  options: AssignmentSelectabilityOptions,
): boolean {
  if (!driver || !options.inBranchScope) return false;
  if (driver.fleetHardBlocked === true) return false;

  const isKeepCurrent = isKeepCurrentResource(driver.id, options);

  if (
    driver.expiredDocsOverridable === true &&
    !options.allowExpiredDocs
  ) {
    if (isKeepCurrent) return true;
    return driver.canBeAssigned === true && driver.softBusy !== true;
  }
  if (driver.canBeAssigned) return true;
  if (driver.softBusy) return true;
  if (isKeepCurrent && driver.expiredDocsOverridable === true) return true;
  return options.allowExpiredDocs && driver.expiredDocsOverridable === true;
}

export function shouldClearVehicleSelection(
  vehicle: AssignableVehicleLike | undefined,
  options: AssignmentSelectabilityOptions,
): boolean {
  if (!vehicle) return false;
  return !isVehicleSelectableWithFilters(vehicle, options);
}

export function shouldClearDriverSelection(
  driver: AssignableDriverLike | undefined,
  options: AssignmentSelectabilityOptions,
): boolean {
  if (!driver) return false;
  return !isDriverSelectableWithFilters(driver, options);
}
