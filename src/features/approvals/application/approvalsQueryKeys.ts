import type { ListApprovalsFilters } from "../domain";

export const approvalsQueryKeys = {
  all: ["finance-approvals"] as const,
  lists: () => [...approvalsQueryKeys.all, "list"] as const,
  list: (filters: ListApprovalsFilters) =>
    [...approvalsQueryKeys.lists(), filters] as const,
  pendingCount: () => [...approvalsQueryKeys.all, "pending-count"] as const,
};
