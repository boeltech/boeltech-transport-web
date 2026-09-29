import type { ActiveFilterChip } from "@shared/ui/listing";
import type { ApprovableItem } from "../../domain";
import { approvalsCopy } from "../copy/approvalsCopy";

/** Query param cuando el usuario elige «Todos los estados». */
export const APPROVAL_STATUS_ALL = "all";

const copy = approvalsCopy.inbox;

export interface ApprovalContextFilterParams {
  tripId: string | null;
  tripCode: string | null;
  driverId: string | null;
  vehicleId: string | null;
}

export function resolveTripFilterLabel(
  tripId: string | null,
  tripCodeFromUrl: string | null,
  items: ApprovableItem[],
): string | null {
  if (!tripId) return null;
  if (tripCodeFromUrl) return tripCodeFromUrl;
  const match = items.find(
    (item) =>
      item.context.approvableType === "trip_expense" &&
      item.context.tripId === tripId,
  );
  if (match?.context.approvableType === "trip_expense") {
    return match.context.tripCode;
  }
  return copy.filters.tripUnknown;
}

export function resolveDriverFilterLabel(
  driverId: string | null,
  items: ApprovableItem[],
): string | null {
  if (!driverId) return null;
  for (const item of items) {
    if (
      item.context.approvableType === "trip_expense" &&
      item.context.driverId === driverId &&
      item.context.driverFullName
    ) {
      return item.context.driverFullName;
    }
    if (
      item.context.approvableType === "driver_advance_request" &&
      item.context.employeeId === driverId &&
      item.context.employeeFullName
    ) {
      return item.context.employeeFullName;
    }
  }
  return copy.filters.driverUnknown;
}

export function resolveVehicleFilterLabel(
  vehicleId: string | null,
  items: ApprovableItem[],
): string | null {
  if (!vehicleId) return null;
  for (const item of items) {
    if (
      item.context.approvableType === "trip_expense" &&
      item.context.vehicleId === vehicleId &&
      item.context.vehicleUnitNumber
    ) {
      return item.context.vehicleUnitNumber;
    }
  }
  return copy.filters.vehicleUnknown;
}

export function hasApprovalUserFilters(input: {
  search: string;
  status: string;
  category: string;
  fromDate: string;
  toDate: string;
  context: ApprovalContextFilterParams;
}): boolean {
  const { search, status, category, fromDate, toDate, context } = input;
  if (search.trim()) return true;
  if (category || fromDate || toDate) return true;
  if (context.tripId || context.driverId || context.vehicleId) return true;
  if (status === APPROVAL_STATUS_ALL) return true;
  if (status && status !== "pending") return true;
  return false;
}

/** Recortes del panel «Filtros». No cuenta search, pending ni deep-links. */
export function countApprovalPanelFilters(input: {
  status: string;
  category: string;
  fromDate: string;
  toDate: string;
  showCategory: boolean;
}): number {
  let count = 0;
  if (input.status === APPROVAL_STATUS_ALL || (input.status && input.status !== "pending")) {
    count += 1;
  }
  if (input.showCategory && input.category) count += 1;
  if (input.fromDate || input.toDate) count += 1;
  return count;
}

export function buildApprovalContextChips(
  context: ApprovalContextFilterParams,
  labels: {
    trip: string | null;
    driver: string | null;
    vehicle: string | null;
  },
  onRemove: (param: keyof ApprovalContextFilterParams) => void,
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (context.tripId && labels.trip) {
    chips.push({
      id: "tripId",
      label: copy.filters.tripChip(labels.trip),
      onRemove: () => onRemove("tripId"),
    });
  }

  if (context.driverId && labels.driver) {
    chips.push({
      id: "driverId",
      label: copy.filters.driverChip(labels.driver),
      onRemove: () => onRemove("driverId"),
    });
  }

  if (context.vehicleId && labels.vehicle) {
    chips.push({
      id: "vehicleId",
      label: copy.filters.vehicleChip(labels.vehicle),
      onRemove: () => onRemove("vehicleId"),
    });
  }

  return chips;
}

export function buildApprovalEmptyState(hasUserFilters: boolean, tripLabel: string | null) {
  if (!hasUserFilters) {
    return {
      title: copy.empty.titleClear,
      description: copy.empty.descriptionClear,
    };
  }

  if (tripLabel) {
    return {
      title: copy.empty.titleFiltered,
      description: copy.empty.descriptionTripFilter(tripLabel),
    };
  }

  return {
    title: copy.empty.titleFiltered,
    description: copy.empty.descriptionFiltered,
  };
}
