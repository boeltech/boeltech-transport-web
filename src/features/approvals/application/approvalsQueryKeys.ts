import type { ApprovalQueue, ListApprovalsFilters } from "../domain";

export const approvalsQueryKeys = {
  all: ["finance-approvals"] as const,
  lists: () => [...approvalsQueryKeys.all, "list"] as const,
  list: (filters: ListApprovalsFilters) =>
    [...approvalsQueryKeys.lists(), filters] as const,
  pendingCount: (type?: string, queue: ApprovalQueue = "mine") =>
    [...approvalsQueryKeys.all, "pending-count", type ?? "all", queue] as const,
  pendingCountsByType: (queue: ApprovalQueue = "mine") =>
    [...approvalsQueryKeys.all, "pending-counts-by-type", queue] as const,
  /** Bajo `all`: se invalida con cada decisión. */
  history: (type: string, id: string) =>
    [...approvalsQueryKeys.all, "history", type, id] as const,
  /** Bajo `all`: se invalida con cada aprobación/rechazo/pago. */
  selfApprovalPolicy: () =>
    [...approvalsQueryKeys.all, "self-approval-policy"] as const,
};
