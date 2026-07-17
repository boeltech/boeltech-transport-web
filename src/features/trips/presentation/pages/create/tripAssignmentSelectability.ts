type AssignableVehicleLike = {
  canBeAssigned: boolean;
  expiredDocsOverridable?: boolean;
};

type AssignableDriverLike = {
  canBeAssigned: boolean;
  expiredDocsOverridable?: boolean;
};

export function isVehicleSelectableWithFilters(
  vehicle: AssignableVehicleLike | undefined,
  options: { allowExpiredDocs: boolean; inBranchScope: boolean },
): boolean {
  if (!vehicle || !options.inBranchScope) return false;
  if (vehicle.canBeAssigned) return true;
  return options.allowExpiredDocs && vehicle.expiredDocsOverridable === true;
}

export function isDriverSelectableWithFilters(
  driver: AssignableDriverLike | undefined,
  options: { allowExpiredDocs: boolean; inBranchScope: boolean },
): boolean {
  if (!driver || !options.inBranchScope) return false;
  if (driver.canBeAssigned) return true;
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
