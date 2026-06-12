import { useQuery } from "@tanstack/react-query";
import { usePermissions } from "@shared/permissions";
import type { ListApprovalsFilters } from "../../domain";
import { approvalsApi } from "../../infrastructure";
import { approvalsQueryKeys } from "../approvalsQueryKeys";

export function useApprovals(filters: ListApprovalsFilters) {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("finance_approvals", "read");

  return useQuery({
    queryKey: approvalsQueryKeys.list(filters),
    queryFn: () => approvalsApi.list(filters),
    enabled: canRead && Boolean(filters.type),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}
