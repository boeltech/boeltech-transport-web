type AssignableVehicleLike = {
  canBeAssigned: boolean;
  expiredDocsOverridable?: boolean;
  softBusy?: boolean;
};

type AssignableDriverLike = {
  canBeAssigned: boolean;
  expiredDocsOverridable?: boolean;
  softBusy?: boolean;
};

export function isVehicleSelectableWithFilters(
  vehicle: AssignableVehicleLike | undefined,
  options: { allowExpiredDocs: boolean; inBranchScope: boolean },
): boolean {
  if (!vehicle || !options.inBranchScope) return false;
  // ADR-0066: softBusy must not bypass the expired-docs gate. keepId elevates
  // canBeAssigned without softBusy and may remain selectable while editing.
  if (
    vehicle.expiredDocsOverridable === true &&
    !options.allowExpiredDocs
  ) {
    return vehicle.canBeAssigned === true && vehicle.softBusy !== true;
  }
  if (vehicle.canBeAssigned) return true;
  if (vehicle.softBusy) return true;
  return options.allowExpiredDocs && vehicle.expiredDocsOverridable === true;
}

export function isDriverSelectableWithFilters(
  driver: AssignableDriverLike | undefined,
  options: { allowExpiredDocs: boolean; inBranchScope: boolean },
): boolean {
  if (!driver || !options.inBranchScope) return false;
  if (
    driver.expiredDocsOverridable === true &&
    !options.allowExpiredDocs
  ) {
    return driver.canBeAssigned === true && driver.softBusy !== true;
  }
  if (driver.canBeAssigned) return true;
  if (driver.softBusy) return true;
  return options.allowExpiredDocs && driver.expiredDocsOverridable === true;
}

export function shouldClearVehicleSelection(
  vehicle: AssignableVehicleLike | undefined,
  options: { allowExpiredDocs: boolean; inBranchScope: boolean },
): boolean {
  if (!vehicle) return false;
  return !isVehicleSelectableWithFilters(vehicle, options);
}

export function shouldClearDriverSelection(
  driver: AssignableDriverLike | undefined,
  options: { allowExpiredDocs: boolean; inBranchScope: boolean },
): boolean {
  if (!driver) return false;
  return !isDriverSelectableWithFilters(driver, options);
}
