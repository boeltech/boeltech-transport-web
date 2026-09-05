import type { WorkbenchBucket } from "@shared/ui/page-shells";
import type { ApprovableType } from "../../domain";
import { approvalsCopy } from "../copy/approvalsCopy";

const copy = approvalsCopy.inbox;

/** Tipos de bandeja v1 (tabs históricos → awareness buckets). */
export const APPROVAL_WORKBENCH_TYPES = [
  "trip_expense",
  "driver_advance_request",
  "internal_staff_compensation",
] as const satisfies readonly ApprovableType[];

export type ApprovalWorkbenchType = (typeof APPROVAL_WORKBENCH_TYPES)[number];

export interface ApprovalPendingCountsByType {
  trip_expense?: number;
  driver_advance_request?: number;
  internal_staff_compensation?: number;
}

const TYPE_LABEL: Record<ApprovalWorkbenchType, string> = {
  trip_expense: copy.tabs.tripExpense,
  driver_advance_request: copy.tabs.driverAdvance,
  internal_staff_compensation: copy.tabs.settlement,
};

function toneForType(
  type: ApprovalWorkbenchType,
  count: number,
): WorkbenchBucket["tone"] {
  if (count <= 0) return "default";
  if (type === "internal_staff_compensation") return "default";
  return "warning";
}

export interface MapApprovalWorkbenchBucketsParams {
  activeType: ApprovableType;
  counts?: ApprovalPendingCountsByType | null;
  onTypeChange: (type: ApprovalWorkbenchType) => void;
}

export function mapApprovalWorkbenchBuckets({
  activeType,
  counts,
  onTypeChange,
}: MapApprovalWorkbenchBucketsParams): WorkbenchBucket[] {
  return APPROVAL_WORKBENCH_TYPES.map((type) => {
    const count =
      type === "trip_expense"
        ? (counts?.trip_expense ?? 0)
        : type === "driver_advance_request"
          ? (counts?.driver_advance_request ?? 0)
          : (counts?.internal_staff_compensation ?? 0);

    return {
      id: type,
      label: TYPE_LABEL[type],
      count,
      isActive: activeType === type,
      onClick: () => onTypeChange(type),
      tone: toneForType(type, count),
    };
  });
}
