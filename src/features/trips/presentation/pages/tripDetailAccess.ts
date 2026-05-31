import {
  canEditTrip,
  canManageTripExpenses,
  type TripStatusType,
} from "@features/trips";

export interface TripDetailAccess {
  canEditStructural: boolean;
  canEditBaseRate: boolean;
  canManageExpenses: boolean;
}

export function getTripDetailAccess(
  status: TripStatusType | undefined,
  canUpdateTrip: boolean,
): TripDetailAccess {
  if (!status || !canUpdateTrip) {
    return {
      canEditStructural: false,
      canEditBaseRate: false,
      canManageExpenses: false,
    };
  }

  const canEditStructural = canEditTrip(status);
  return {
    canEditStructural,
    canEditBaseRate: canEditStructural,
    canManageExpenses: canManageTripExpenses(status),
  };
}
