import type { ListApprovalsFilters } from "../domain";

export const approvalsQueryKeys = {
  all: ["finance-approvals"] as const,
  lists: () => [...approvalsQueryKeys.all, "list"] as const,
  list: (filters: ListApprovalsFilters) =>
    [...approvalsQueryKeys.lists(), filters] as const,
  pendingCount: (type?: string) =>
    [...approvalsQueryKeys.all, "pending-count", type ?? "all"] as const,
  pendingCountsByType: () =>
    [...approvalsQueryKeys.all, "pending-counts-by-type"] as const,
};
