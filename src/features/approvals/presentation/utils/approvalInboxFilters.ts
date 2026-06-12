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
  return tripId;
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

export function buildApprovalContextChips(
  context: ApprovalContextFilterParams,
  tripLabel: string | null,
  onRemove: (param: keyof ApprovalContextFilterParams) => void,
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (context.tripId && tripLabel) {
    chips.push({
      id: "tripId",
      label: copy.filters.tripChip(tripLabel),
      onRemove: () => onRemove("tripId"),
    });
  }

  if (context.driverId) {
    chips.push({
      id: "driverId",
      label: copy.filters.driverChip(context.driverId),
      onRemove: () => onRemove("driverId"),
    });
  }

  if (context.vehicleId) {
    chips.push({
      id: "vehicleId",
      label: copy.filters.vehicleChip(context.vehicleId),
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
